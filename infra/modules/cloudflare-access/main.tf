locals {
  app_email_includes = {
    for app_id, app in var.non_public_apps :
    app_id => app.access_model_kind == "owner-only" ? (
      var.owner_account_email == "" ? [] : [var.owner_account_email]
      ) : (
      lookup(var.shared_access_audience_email_allowlists, app.audience_key, [])
    )
  }
}

resource "cloudflare_zero_trust_access_policy" "app" {
  for_each = var.non_public_apps

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

resource "cloudflare_zero_trust_access_application" "app" {
  for_each = var.non_public_apps

  account_id       = var.cloudflare_account_id
  name             = "lucaszanoni-${each.key}"
  domain           = "${var.zone_name}${trimsuffix(each.value.mount_path, "/")}"
  type             = "self_hosted"
  session_duration = var.session_duration

  policies = [
    {
      id         = cloudflare_zero_trust_access_policy.app[each.key].id
      precedence = 1
    }
  ]
}
