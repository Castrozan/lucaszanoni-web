locals {
  cockpit_session_external_https_origins = merge(
    {
      "/cockpit/lifecycle" = {
        origin_host         = "jarvis-session-origin.${local.edge_serving_domain}"
        path_rewrite        = "preserve"
        forwarded_base_path = ""
        trusted             = false
      }
    },
    var.enable_kira_session_tunnel ? {
      "/cockpit/kira-session/" = {
        origin_host         = one(module.kira_session_tunnel[*].origin_hostname)
        path_rewrite        = "strip-mount-path"
        forwarded_base_path = "/cockpit/"
        trusted             = false
      }
    } : {},
    var.enable_rin_session_tunnel ? {
      "/cockpit/rin-session/" = {
        origin_host         = one(module.rin_session_tunnel[*].origin_hostname)
        path_rewrite        = "strip-mount-path"
        forwarded_base_path = "/cockpit/"
        trusted             = false
      }
    } : {}
  )
}

module "jarvis_session_tunnel" {
  source = "../../modules/cloudflare-jarvis-tunnel"
  count  = var.enable_jarvis_session_tunnel ? 1 : 0

  cloudflare_account_id = var.cloudflare_account_id
  zone_name             = local.edge_serving_domain
  origin_hostname       = "jarvis-session-origin.${local.edge_serving_domain}"
  tunnel_secret         = var.jarvis_session_tunnel_secret
}

module "kira_session_tunnel" {
  source = "../../modules/cloudflare-jarvis-tunnel"
  count  = var.enable_kira_session_tunnel ? 1 : 0

  cloudflare_account_id = var.cloudflare_account_id
  zone_name             = local.edge_serving_domain
  tunnel_name           = "lucaszanoni-kira-session"
  origin_hostname       = "kira-session-origin.${local.edge_serving_domain}"
  tunnel_secret         = var.kira_session_tunnel_secret
}

module "rin_session_tunnel" {
  source = "../../modules/cloudflare-jarvis-tunnel"
  count  = var.enable_rin_session_tunnel ? 1 : 0

  cloudflare_account_id = var.cloudflare_account_id
  zone_name             = local.edge_serving_domain
  tunnel_name           = "lucaszanoni-rin-session"
  origin_hostname       = "rin-session-origin.${local.edge_serving_domain}"
  tunnel_secret         = var.rin_session_tunnel_secret
}
