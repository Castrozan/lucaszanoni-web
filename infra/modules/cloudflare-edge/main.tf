locals {
  edge_routing_table = {
    shell = var.shell_origin_host
    prefixes = [
      for prefix, origin_host in var.prefix_origin_hosts : {
        prefix = prefix
        host   = origin_host
      }
    ]
    staticBucketPrefixes = [
      for prefix, origin in var.static_bucket_prefix_origins : {
        prefix          = prefix
        bucket          = origin.bucket
        objectKeyPrefix = origin.object_key_prefix
      }
    ]
  }
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

resource "cloudflare_workers_script" "edge_router" {
  account_id         = var.cloudflare_account_id
  script_name        = "lucaszanoni-edge-router"
  content            = file("${path.module}/edge-router-worker.mjs")
  main_module        = "worker.js"
  compatibility_date = "2024-11-01"

  bindings = [
    {
      name = "EDGE_ROUTES"
      type = "plain_text"
      text = jsonencode(local.edge_routing_table)
    },
    {
      name = "EDGE_SHARED_SECRET_HEADER_NAME"
      type = "plain_text"
      text = var.edge_shared_secret_header_name
    },
    {
      name = "EDGE_SHARED_SECRET"
      type = "secret_text"
      text = var.edge_shared_secret_value
    },
  ]
}

resource "cloudflare_workers_route" "edge_router_catch_all" {
  zone_id = data.cloudflare_zone.this.id
  pattern = "${var.zone_name}/*"
  script  = cloudflare_workers_script.edge_router.script_name
}
