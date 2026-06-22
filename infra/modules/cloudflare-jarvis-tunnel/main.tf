data "cloudflare_zone" "this" {
  filter = {
    name = var.zone_name
    account = {
      id = var.cloudflare_account_id
    }
  }
}

resource "cloudflare_zero_trust_tunnel_cloudflared" "this" {
  account_id    = var.cloudflare_account_id
  name          = var.tunnel_name
  config_src    = "local"
  tunnel_secret = var.tunnel_secret
}

resource "cloudflare_dns_record" "tunnel_origin" {
  zone_id = data.cloudflare_zone.this.id
  name    = var.origin_hostname
  type    = "CNAME"
  content = "${cloudflare_zero_trust_tunnel_cloudflared.this.id}.cfargotunnel.com"
  proxied = true
  ttl     = 1
}
