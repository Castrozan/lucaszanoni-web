output "shell_service_uri" {
  value = module.shell.service_uri
}

output "usage_dashboard_service_uri" {
  value = module.usage_dashboard.service_uri
}

output "reports_service_uri" {
  value = module.reports.service_uri
}

output "application_image_registry" {
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.application_images.repository_id}"
  description = "Base Artifact Registry path the app-deploy workflow pushes each micro-frontend image to."
}

output "edge_zone_id" {
  value = one(module.edge[*].zone_id)
}

output "edge_name_servers" {
  value       = one(module.edge[*].name_servers)
  description = "Paste these two nameservers into the registro.br panel to delegate lucaszanoni.com.br to Cloudflare. Null until enable_cloudflare_edge is set."
}
