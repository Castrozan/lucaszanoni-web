output "protected_domains" {
  value = {
    for app_id, app in cloudflare_zero_trust_access_application.app :
    app_id => app.domain
  }
  description = "Map of registry app id to the host-and-path each managed Access application protects at the edge."
}

output "google_sso_login_enabled" {
  value       = nonsensitive(local.google_sso_enabled)
  description = "Whether a Google identity provider is provisioned and bound to the managed Access applications as the login method. False keeps Cloudflare's default email one-time-pin login."
}
