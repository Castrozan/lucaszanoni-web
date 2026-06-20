output "zone_id" {
  value = cloudflare_zone.this.id
}

output "name_servers" {
  value       = cloudflare_zone.this.name_servers
  description = "The two Cloudflare nameservers to paste into the registro.br panel to delegate the domain. This is the single manual DNS step."
}
