resource "cloudflare_zero_trust_access_policy" "local_cockpit_bundle_public_bypass" {
  account_id = var.cloudflare_account_id
  name       = "lucaszanoni-local-cockpit-bundle-public-bypass"
  decision   = "bypass"

  include = [
    {
      everyone = {}
    }
  ]
}

resource "cloudflare_zero_trust_access_application" "local_cockpit_bundle_public" {
  account_id       = var.cloudflare_account_id
  name             = "lucaszanoni-local-cockpit-bundle-public"
  domain           = "${local.edge_serving_domain}/cockpit/local-cockpit.py"
  type             = "self_hosted"
  session_duration = "24h"

  policies = [
    {
      id         = cloudflare_zero_trust_access_policy.local_cockpit_bundle_public_bypass.id
      precedence = 1
    }
  ]
}
