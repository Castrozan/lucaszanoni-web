mock_provider "cloudflare" {}

variables {
  zone_name                = "lucaszanoni.test"
  cloudflare_account_id    = "0000000000000000000000000000abcd"
  shell_origin_host        = "shell.example.test"
  prefix_origin_hosts      = {}
  edge_shared_secret_value = "test-edge-secret"
  worker_assets_prefixes   = ["/cockpit/"]
}

run "private_worker_assets_survive_infrastructure_updates" {
  command = plan

  assert {
    condition     = cloudflare_workers_script.edge_router.keep_assets
    error_message = "Infrastructure code updates must retain the separately uploaded static files."
  }

  assert {
    condition     = length([for binding in cloudflare_workers_script.edge_router.bindings : binding.name if binding.name == "ASSETS" && binding.type == "assets"]) == 1
    error_message = "The existing private Worker must expose exactly one static asset binding."
  }

  assert {
    condition     = jsondecode([for binding in cloudflare_workers_script.edge_router.bindings : binding.text if binding.name == "EDGE_ROUTES"][0]).workerAssetsPrefixes == [{ prefix = "/cockpit/" }]
    error_message = "The routing table must serve Cockpit through static assets without a Cloud Run origin."
  }
}
