locals {
  jellyseerr_media_origin_hostname = "requests.${local.edge_serving_domain}"
  jellyseerr_media_audience_key    = "media-friends"
  jellyseerr_media_email_allowlist = lookup(
    var.shared_access_audience_email_allowlists,
    local.jellyseerr_media_audience_key,
    []
  )
  jellyseerr_media_google_identity_provider_id = one(module.access[*].google_identity_provider_id)
}

module "jellyseerr_media_tunnel" {
  source = "../../modules/cloudflare-jarvis-tunnel"
  count  = var.enable_jellyseerr_media_tunnel ? 1 : 0

  cloudflare_account_id = var.cloudflare_account_id
  zone_name             = local.edge_serving_domain
  tunnel_name           = "lucaszanoni-jellyseerr-media"
  origin_hostname       = local.jellyseerr_media_origin_hostname
  tunnel_secret         = var.jellyseerr_media_tunnel_secret
}

resource "cloudflare_zero_trust_access_policy" "jellyseerr_media_allow" {
  count = var.enable_jellyseerr_media_tunnel ? 1 : 0

  account_id = var.cloudflare_account_id
  name       = "lucaszanoni-jellyseerr-media-allow"
  decision   = "allow"

  include = [
    for email in local.jellyseerr_media_email_allowlist : {
      email = {
        email = email
      }
    }
  ]

  lifecycle {
    precondition {
      condition     = length(local.jellyseerr_media_email_allowlist) > 0
      error_message = "The jellyseerr media Access policy resolved an empty allowlist; set shared_access_audience_email_allowlists[\"media-friends\"] before enabling the jellyseerr media tunnel."
    }
  }
}

resource "cloudflare_zero_trust_access_application" "jellyseerr_media" {
  count = var.enable_jellyseerr_media_tunnel ? 1 : 0

  account_id       = var.cloudflare_account_id
  name             = "lucaszanoni-jellyseerr-media"
  domain           = local.jellyseerr_media_origin_hostname
  type             = "self_hosted"
  session_duration = "24h"

  allowed_idps = (
    local.jellyseerr_media_google_identity_provider_id != null
    ? [local.jellyseerr_media_google_identity_provider_id]
    : null
  )
  auto_redirect_to_identity = (
    local.jellyseerr_media_google_identity_provider_id != null ? true : null
  )

  policies = [
    {
      id         = cloudflare_zero_trust_access_policy.jellyseerr_media_allow[0].id
      precedence = 1
    }
  ]
}
