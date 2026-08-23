locals {
  arr_stack_media_hostnames = var.enable_cloudflare_edge ? {
    jellyfin   = "watch.${local.edge_serving_domain}"
    jellyseerr = "request.${local.edge_serving_domain}"
  } : {}

  arr_stack_media_private_applications = var.enable_jarvis_session_tunnel && var.enable_cloudflare_edge ? {
    for application_id, application_domain in local.arr_stack_media_hostnames :
    application_id => {
      application_domain = application_domain
      audience_kind      = "owner"
      audience_key       = ""
    }
  } : {}
}
