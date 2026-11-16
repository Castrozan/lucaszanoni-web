locals {
  edge_router_script_name = "lucaszanoni-edge-router"
}

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

resource "cloudflare_zone_setting" "ssl_full_strict" {
  zone_id    = data.cloudflare_zone.this.id
  setting_id = "ssl"
  value      = "strict"
}

resource "cloudflare_zone_setting" "always_use_https" {
  zone_id    = data.cloudflare_zone.this.id
  setting_id = "always_use_https"
  value      = "on"
}

removed {
  from = cloudflare_workers_script.edge_router

  lifecycle {
    destroy = false
  }
}

resource "cloudflare_workers_route" "edge_router_catch_all" {
  zone_id = data.cloudflare_zone.this.id
  pattern = "${var.zone_name}/*"
  script  = local.edge_router_script_name
}

resource "cloudflare_dns_record" "subdomain_proxied" {
  for_each = var.subdomain_labels

  zone_id = data.cloudflare_zone.this.id
  name    = "${each.value}.${var.zone_name}"
  type    = "A"
  content = var.proxied_placeholder_origin_ip
  proxied = true
  ttl     = 1
}

resource "cloudflare_workers_route" "edge_router_subdomain" {
  for_each = var.subdomain_labels

  zone_id = data.cloudflare_zone.this.id
  pattern = "${each.value}.${var.zone_name}/*"
  script  = local.edge_router_script_name
}

data "cloudflare_zone" "alias" {
  count = var.alias_zone_name == null ? 0 : 1

  filter = {
    name = var.alias_zone_name
    account = {
      id = var.cloudflare_account_id
    }
  }
}

resource "cloudflare_dns_record" "alias_apex_proxied" {
  count = var.alias_zone_name == null ? 0 : 1

  zone_id = data.cloudflare_zone.alias[0].id
  name    = var.alias_zone_name
  type    = "A"
  content = var.proxied_placeholder_origin_ip
  proxied = true
  ttl     = 1
}

resource "cloudflare_workers_route" "edge_router_alias_catch_all" {
  count = var.alias_zone_name == null ? 0 : 1

  zone_id = data.cloudflare_zone.alias[0].id
  pattern = "${var.alias_zone_name}/*"
  script  = local.edge_router_script_name
}
