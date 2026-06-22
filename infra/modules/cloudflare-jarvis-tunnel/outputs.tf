output "tunnel_id" {
  value = cloudflare_zero_trust_tunnel_cloudflared.this.id
}

output "origin_hostname" {
  value = var.origin_hostname
}

output "connector_credentials_json" {
  value = jsonencode({
    AccountTag   = var.cloudflare_account_id
    TunnelID     = cloudflare_zero_trust_tunnel_cloudflared.this.id
    TunnelSecret = var.tunnel_secret
  })
  sensitive = true
}
