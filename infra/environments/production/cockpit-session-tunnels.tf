module "jarvis_session_tunnel" {
  source = "../../modules/cloudflare-jarvis-tunnel"
  count  = var.enable_jarvis_session_tunnel ? 1 : 0

  depends_on = [module.access]

  # Keep Access-before-DNS ordering without making existing DNS zone IDs unknown.
  zone_id = var.enable_cloudflare_edge ? one(module.edge[*].zone_id) : null

  cloudflare_account_id       = var.cloudflare_account_id
  zone_name                   = local.edge_serving_domain
  origin_hostname             = "jarvis-session-origin.${local.edge_serving_domain}"
  additional_origin_hostnames = values(local.arr_stack_media_hostnames)
  tunnel_secret               = var.jarvis_session_tunnel_secret
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
