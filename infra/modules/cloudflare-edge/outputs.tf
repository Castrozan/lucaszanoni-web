output "zone_id" {
  value = data.cloudflare_zone.this.id
}

output "name_servers" {
  value       = data.cloudflare_zone.this.name_servers
  description = "The two Cloudflare nameservers for the zone. Delegation at registro.br is already in place, so this output is informational confirmation of the active nameservers."
}
