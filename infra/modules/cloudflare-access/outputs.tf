output "protected_domains" {
  value = {
    for app_id, app in cloudflare_zero_trust_access_application.app :
    app_id => app.domain
  }
  description = "Map of registry app id to the host-and-path each managed Access application protects at the edge."
}
