mock_provider "cloudflare" {}

variables {
  zone_name                = "lucaszanoni.test"
  cloudflare_account_id    = "0000000000000000000000000000abcd"
  shell_origin_host        = "shell.example.test"
  prefix_origin_hosts      = {}
  edge_shared_secret_value = "test-edge-secret"
  worker_service_prefixes  = { "/cockpit/" = "APP_COCKPIT" }
  worker_services          = { APP_COCKPIT = "lucaszanoni-cockpit" }
}

run "private_app_workers_remain_isolated_from_the_edge" {
  command = plan

  assert {
    condition     = !cloudflare_workers_script.edge_router.keep_assets
    error_message = "The edge router must not retain a shared public/private asset store."
  }

  assert {
    condition     = length([for binding in cloudflare_workers_script.edge_router.bindings : binding.name if binding.type == "assets"]) == 0
    error_message = "Assets belong to independent private app Workers."
  }

  assert {
    condition     = length([for binding in cloudflare_workers_script.edge_router.bindings : binding.name if binding.name == "APP_COCKPIT" && binding.type == "service" && binding.service == "lucaszanoni-cockpit"]) == 1
    error_message = "The edge must call Cockpit through its private service binding."
  }

  assert {
    condition     = jsondecode([for binding in cloudflare_workers_script.edge_router.bindings : binding.text if binding.name == "EDGE_ROUTES"][0]).workerServicePrefixes == [{ prefix = "/cockpit/", binding = "APP_COCKPIT" }]
    error_message = "Routing must identify the app service instead of a shared asset binding."
  }
}
