output "shell_service_uri" {
  value = module.in_repo_cloud_run_app["shell"].service_uri
}

output "usage_dashboard_service_uri" {
  value = module.in_repo_cloud_run_app["usage-dashboard"].service_uri
}

output "reports_service_uri" {
  value = module.in_repo_cloud_run_app["reports"].service_uri
}

output "application_image_registry" {
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/lucaszanoni-web"
  description = "Base Artifact Registry path the app-deploy workflow pushes each micro-frontend image to. The repository itself is provisioned in the owner-run GCP foundation state, not here."
}

output "edge_zone_id" {
  value = one(module.edge[*].zone_id)
}

output "edge_name_servers" {
  value       = one(module.edge[*].name_servers)
  description = "Paste these two nameservers into the registro.br panel to delegate lucaszanoni.com.br to Cloudflare. Null until enable_cloudflare_edge is set."
}

output "jarvis_session_tunnel_id" {
  value       = one(module.jarvis_session_tunnel[*].tunnel_id)
  description = "Id of the locally-managed Cloudflare Tunnel fronting chise's Jarvis session bridge. Null until enable_jarvis_session_tunnel is set; feeds chise's cloudflared connector tunnelId."
}

output "jarvis_session_tunnel_origin_hostname" {
  value       = one(module.jarvis_session_tunnel[*].origin_hostname)
  description = "Cloudflare-proxied origin hostname the edge route targets for the Jarvis session bridge. Null until enable_jarvis_session_tunnel is set."
}

output "jarvis_session_connector_credentials_json" {
  value       = one(module.jarvis_session_tunnel[*].connector_credentials_json)
  sensitive   = true
  description = "Connector credentials JSON chise's cloudflared authenticates with, marshalled for the agenix handoff. Null until enable_jarvis_session_tunnel is set; read out-of-band at activation, never committed."
}

output "kira_session_tunnel_id" {
  value       = one(module.kira_session_tunnel[*].tunnel_id)
  description = "Id of the locally-managed Cloudflare Tunnel fronting kira's session bridge. Null until enable_kira_session_tunnel is set; feeds kira's cloudflared connector tunnelId."
}

output "kira_session_tunnel_origin_hostname" {
  value       = one(module.kira_session_tunnel[*].origin_hostname)
  description = "Cloudflare-proxied origin hostname the edge route targets for kira's session bridge. Null until enable_kira_session_tunnel is set."
}

output "kira_session_connector_credentials_json" {
  value       = one(module.kira_session_tunnel[*].connector_credentials_json)
  sensitive   = true
  description = "Connector credentials JSON kira's cloudflared authenticates with, marshalled for the agenix handoff. Null until enable_kira_session_tunnel is set; read out-of-band at activation, never committed."
}
