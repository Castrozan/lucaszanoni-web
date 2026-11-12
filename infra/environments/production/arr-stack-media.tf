locals {
  arr_stack_media_hostnames = var.enable_cloudflare_edge ? {
    readmeabook    = "readmeabook.${local.edge_serving_domain}"
    audiobookshelf = "audiobookshelf.${local.edge_serving_domain}"
    jellyfin       = "watch.${local.edge_serving_domain}"
    jellyseerr     = "request.${local.edge_serving_domain}"
    stremio        = "stream.${local.edge_serving_domain}"
    miwayomi       = "anime.${local.edge_serving_domain}"
    suwayomi       = "suwayomi.${local.edge_serving_domain}"
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
