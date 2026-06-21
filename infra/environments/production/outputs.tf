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
