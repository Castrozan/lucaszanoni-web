data "cloudflare_zone" "this" {
  filter = {
    name = var.zone_name
    account = {
      id = var.cloudflare_account_id
    }
  }
}

resource "cloudflare_dns_record" "apex_proxied" {
  zone_id = data.cloudflare_zone.this.id
  name    = var.zone_name
  type    = "A"
  content = var.proxied_placeholder_origin_ip
  proxied = true
  ttl     = 1
}

resource "cloudflare_ruleset" "redirect_to_canonical" {
  zone_id = data.cloudflare_zone.this.id
  name    = "redirect-alias-to-canonical"
  kind    = "zone"
  phase   = "http_request_dynamic_redirect"

  rules = [{
    ref         = "redirect_every_request_to_canonical_domain"
    description = "Permanently redirect every request on the alias zone to the canonical domain, preserving path and query string."
    expression  = "true"
    action      = "redirect"
    action_parameters = {
      from_value = {
        status_code           = var.redirect_status_code
        preserve_query_string = true
        target_url = {
          expression = "concat(\"https://${var.canonical_domain_name}\", http.request.uri.path)"
        }
      }
    }
  }]
}
