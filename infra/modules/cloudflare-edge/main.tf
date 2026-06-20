locals {
  origin_route_rules = [
    for prefix, origin_host in var.prefix_origin_hosts : {
      prefix      = prefix
      origin_host = origin_host
      expression  = format("starts_with(http.request.uri.path, \"%s\")", prefix)
    }
  ]

  shell_catch_all_origin_rule = {
    ref        = "origin_shell_catch_all"
    expression = "true"
    action     = "route"
    enabled    = true
    action_parameters = {
      host_header = var.shell_origin_host
      origin = {
        host = var.shell_origin_host
      }
    }
  }

  prefix_origin_rules = [
    for route in local.origin_route_rules : {
      ref        = format("origin_%s", replace(trim(route.prefix, "/"), "/", "_"))
      expression = route.expression
      action     = "route"
      enabled    = true
      action_parameters = {
        host_header = route.origin_host
        origin = {
          host = route.origin_host
        }
      }
    }
  ]
}

resource "cloudflare_zone" "this" {
  account = {
    id = var.cloudflare_account_id
  }
  name = var.zone_name
  type = "full"
}

resource "cloudflare_dns_record" "apex_proxied" {
  zone_id = cloudflare_zone.this.id
  name    = var.zone_name
  type    = "A"
  content = var.proxied_placeholder_origin_ip
  proxied = true
  ttl     = 1
}

resource "cloudflare_zone_setting" "ssl_full_strict" {
  zone_id    = cloudflare_zone.this.id
  setting_id = "ssl"
  value      = "strict"
}

resource "cloudflare_zone_setting" "always_use_https" {
  zone_id    = cloudflare_zone.this.id
  setting_id = "always_use_https"
  value      = "on"
}

resource "cloudflare_ruleset" "origin_router" {
  zone_id = cloudflare_zone.this.id
  name    = "edge path origin router"
  kind    = "zone"
  phase   = "http_request_origin"

  rules = concat([local.shell_catch_all_origin_rule], local.prefix_origin_rules)
}

resource "cloudflare_ruleset" "edge_shared_secret_injector" {
  zone_id = cloudflare_zone.this.id
  name    = "edge shared secret header injector"
  kind    = "zone"
  phase   = "http_request_late_transform"

  rules = [
    {
      ref        = "inject_edge_shared_secret"
      expression = "true"
      action     = "rewrite"
      enabled    = true
      action_parameters = {
        headers = {
          (var.edge_shared_secret_header_name) = {
            operation = "set"
            value     = var.edge_shared_secret_value
          }
        }
      }
    },
  ]
}

resource "cloudflare_ruleset" "cache_bypass_for_html_and_root" {
  zone_id = cloudflare_zone.this.id
  name    = "bypass cache for the shell root and html documents"
  kind    = "zone"
  phase   = "http_request_cache_settings"

  rules = [
    {
      ref        = "bypass_cache_for_html_and_root"
      expression = "(http.request.uri.path eq \"/\") or (ends_with(http.request.uri.path, \".html\"))"
      action     = "set_cache_settings"
      enabled    = true
      action_parameters = {
        cache = false
      }
    },
  ]
}
