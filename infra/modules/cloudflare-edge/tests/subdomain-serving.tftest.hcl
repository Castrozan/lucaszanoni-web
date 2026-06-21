mock_provider "cloudflare" {}

variables {
  zone_name                = "lucaszanoni.test"
  cloudflare_account_id    = "0000000000000000000000000000abcd"
  shell_origin_host        = "shell.example.test"
  prefix_origin_hosts      = {}
  edge_shared_secret_value = "test-edge-secret"
}

run "no_subdomain_resources_when_labels_absent" {
  command = plan

  assert {
    condition     = length(cloudflare_dns_record.subdomain_proxied) == 0
    error_message = "an empty subdomain label set must provision no subdomain dns records so the apex-only deployment stays byte-identical"
  }

  assert {
    condition     = length(cloudflare_workers_route.edge_router_subdomain) == 0
    error_message = "an empty subdomain label set must provision no subdomain worker routes"
  }
}

run "one_proxied_host_and_route_per_subdomain_label" {
  command = plan

  variables {
    subdomain_serving_labels = ["ledger", "db"]
  }

  assert {
    condition     = length(cloudflare_dns_record.subdomain_proxied) == 2
    error_message = "each subdomain label must provision exactly one proxied dns record"
  }

  assert {
    condition     = cloudflare_dns_record.subdomain_proxied["ledger"].name == "ledger.lucaszanoni.test"
    error_message = "the subdomain dns record name must be the label joined to the zone name"
  }

  assert {
    condition     = cloudflare_dns_record.subdomain_proxied["ledger"].proxied == true
    error_message = "the subdomain dns record must be orange-clouded so the edge worker fronts the subdomain"
  }

  assert {
    condition     = length(cloudflare_workers_route.edge_router_subdomain) == 2
    error_message = "each subdomain label must attach the edge worker via exactly one route"
  }

  assert {
    condition     = cloudflare_workers_route.edge_router_subdomain["db"].pattern == "db.lucaszanoni.test/*"
    error_message = "the subdomain worker route must cover the entire subdomain"
  }

  assert {
    condition     = cloudflare_workers_route.edge_router_subdomain["db"].script == cloudflare_workers_script.edge_router.script_name
    error_message = "the subdomain route must point at the same edge router script as the apex route"
  }
}
