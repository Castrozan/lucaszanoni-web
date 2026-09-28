mock_provider "cloudflare" {}

variables {
  cloudflare_account_id = "0000000000000000000000000000abcd"
  zone_name             = "lucaszanoni.test"
  origin_hostname       = "jarvis-session-origin.lucaszanoni.test"
  additional_origin_hostnames = [
    "request.lucaszanoni.test",
    "watch.lucaszanoni.test",
  ]
  tunnel_secret = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
}

run "one_proxied_dns_record_per_declared_origin_hostname" {
  command = apply

  assert {
    condition     = cloudflare_dns_record.tunnel_origin.name == "jarvis-session-origin.lucaszanoni.test" && length(cloudflare_dns_record.additional_tunnel_origin) == 2
    error_message = "the host tunnel must publish its primary session origin and every additional media origin through the same connector"
  }

  assert {
    condition     = cloudflare_dns_record.additional_tunnel_origin["watch.lucaszanoni.test"].content == "${cloudflare_zero_trust_tunnel_cloudflared.this.id}.cfargotunnel.com"
    error_message = "the watch hostname must target the named tunnel instead of opening a direct host port"
  }

  assert {
    condition     = cloudflare_dns_record.additional_tunnel_origin["watch.lucaszanoni.test"].proxied == true
    error_message = "the watch hostname must stay proxied so Cloudflare Access gates it before the tunnel"
  }
}

run "explicit_zone_id_is_preserved_for_all_dns_records" {
  command = plan

  variables {
    zone_id = "00000000000000000000000000001234"
  }

  assert {
    condition = cloudflare_dns_record.tunnel_origin.zone_id == var.zone_id && alltrue([
      for record in cloudflare_dns_record.additional_tunnel_origin : record.zone_id == var.zone_id
    ])
    error_message = "An explicit zone ID must keep every DNS record plan-known even when the module's zone lookup is deferred."
  }
}
