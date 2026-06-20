output "shell_service_uri" {
  value = module.shell.service_uri
}

output "usage_dashboard_service_uri" {
  value = module.usage_dashboard.service_uri
}

output "reports_service_uri" {
  value = module.reports.service_uri
}

output "edge_zone_id" {
  value = module.edge.zone_id
}

output "edge_name_servers" {
  value       = module.edge.name_servers
  description = "Paste these two nameservers into the registro.br panel to delegate lucaszanoni.com.br to Cloudflare."
}
