mock_provider "cloudflare" {}

variables {
  zone_name                = "lucaszanoni.test"
  cloudflare_account_id    = "0000000000000000000000000000abcd"
  shell_origin_host        = "shell.example.test"
  prefix_origin_hosts      = {}
  edge_shared_secret_value = "test-edge-secret"
}

run "no_subdomain_resources_when_apps_absent" {
  command = plan

  assert {
    condition     = length(cloudflare_dns_record.subdomain_proxied) == 0
    error_message = "an empty subdomain app map must provision no subdomain dns records so the apex-only deployment stays byte-identical"
  }

  assert {
    condition     = length(cloudflare_workers_route.edge_router_subdomain) == 0
    error_message = "an empty subdomain app map must provision no subdomain worker routes"
  }

  assert {
    condition     = strcontains([for binding in cloudflare_workers_script.edge_router.bindings : binding.text if binding.name == "EDGE_ROUTES"][0], "\"subdomains\":[]")
    error_message = "an empty subdomain app map must still emit an empty subdomains routing-table section so the worker reads a defined list"
  }
}

run "one_proxied_host_and_route_per_subdomain_app" {
  command = plan

  variables {
    subdomain_apps = {
      ledger = {
        origin_host = "lucaszanoni-ledger.example.run.app"
        origin_kind = "in-repo-cloud-run"
        trusted     = true
      }
      db = {
        origin_host = "db.external.example"
        origin_kind = "external-https"
        trusted     = false
      }
    }
  }

  assert {
    condition     = length(cloudflare_dns_record.subdomain_proxied) == 2
    error_message = "each subdomain app must provision exactly one proxied dns record"
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
    error_message = "each subdomain app must attach the edge worker via exactly one route"
  }

  assert {
    condition     = cloudflare_workers_route.edge_router_subdomain["db"].pattern == "db.lucaszanoni.test/*"
    error_message = "the subdomain worker route must cover the entire subdomain"
  }

  assert {
    condition     = cloudflare_workers_route.edge_router_subdomain["db"].script == cloudflare_workers_script.edge_router.script_name
    error_message = "the subdomain route must point at the same edge router script as the apex route"
  }

  assert {
    condition     = strcontains([for binding in cloudflare_workers_script.edge_router.bindings : binding.text if binding.name == "EDGE_ROUTES"][0], "\"host\":\"ledger.lucaszanoni.test\",\"originHost\":\"lucaszanoni-ledger.example.run.app\",\"originKind\":\"in-repo-cloud-run\",\"trusted\":true")
    error_message = "an in-repo subdomain app must route by host to its own cloud run origin with the shared-secret-bearing origin kind"
  }

  assert {
    condition     = strcontains([for binding in cloudflare_workers_script.edge_router.bindings : binding.text if binding.name == "EDGE_ROUTES"][0], "\"host\":\"db.lucaszanoni.test\",\"originHost\":\"db.external.example\",\"originKind\":\"external-https\",\"trusted\":false")
    error_message = "an external-https subdomain app must route by host to its external origin marked untrusted so the worker strips its identity assertion"
  }
}
