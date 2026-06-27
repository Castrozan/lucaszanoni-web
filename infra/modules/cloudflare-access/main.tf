locals {
  app_email_includes = {
    for app_id, app in var.private_environment_apps :
    app_id => app.audience_kind == "owner" ? (
      var.owner_account_email == "" ? [] : [var.owner_account_email]
      ) : (
      lookup(var.shared_access_audience_email_allowlists, app.audience_key, [])
    )
  }

  google_sso_enabled = var.google_sso_client_id != "" && var.google_sso_client_secret != ""

  google_identity_provider_ids = [
    for identity_provider in cloudflare_zero_trust_access_identity_provider.google : identity_provider.id
  ]
}

resource "cloudflare_zero_trust_access_policy" "app" {
  for_each = var.private_environment_apps

  account_id = var.cloudflare_account_id
  name       = "lucaszanoni-${each.key}-allow"
  decision   = "allow"

  include = [
    for email in local.app_email_includes[each.key] : {
      email = {
        email = email
      }
    }
  ]

  lifecycle {
    precondition {
      condition     = length(local.app_email_includes[each.key]) > 0
      error_message = "Access application ${each.key} resolved an empty email allowlist; set the owner email or the audience allowlist secret before applying."
    }
  }
}

resource "cloudflare_zero_trust_access_identity_provider" "google" {
  count = local.google_sso_enabled ? 1 : 0

  account_id = var.cloudflare_account_id
  name       = "Google"
  type       = "google"

  config = {
    client_id     = var.google_sso_client_id
    client_secret = var.google_sso_client_secret
  }
}

resource "cloudflare_zero_trust_access_application" "app" {
  for_each = var.private_environment_apps

  account_id       = var.cloudflare_account_id
  name             = "lucaszanoni-${each.key}"
  domain           = "${var.zone_name}${trimsuffix(each.value.mount_path, "/")}"
  type             = "self_hosted"
  session_duration = var.session_duration

  allowed_idps              = local.google_sso_enabled ? local.google_identity_provider_ids : null
  auto_redirect_to_identity = local.google_sso_enabled ? true : null

  policies = [
    {
      id         = cloudflare_zero_trust_access_policy.app[each.key].id
      precedence = 1
    }
  ]
}
