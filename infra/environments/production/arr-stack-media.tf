locals {
  arr_stack_media_hostnames = var.enable_cloudflare_edge ? {
    jellyfin    = "watch.${local.edge_serving_domain}"
    jellyseerr  = "request.${local.edge_serving_domain}"
    kavita      = "read.${local.edge_serving_domain}"
    stremio     = "stream.${local.edge_serving_domain}"
    miwayomi    = "anime.${local.edge_serving_domain}"
    radarr      = "radarr.${local.edge_serving_domain}"
    sonarr      = "sonarr.${local.edge_serving_domain}"
    prowlarr    = "prowlarr.${local.edge_serving_domain}"
    bazarr      = "bazarr.${local.edge_serving_domain}"
    suwayomi    = "suwayomi.${local.edge_serving_domain}"
    qbittorrent = "qbittorrent.${local.edge_serving_domain}"
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
