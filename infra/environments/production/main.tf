resource "google_artifact_registry_repository" "application_images" {
  project       = var.project_id
  location      = var.region
  repository_id = "lucaszanoni-web"
  format        = "DOCKER"
  description   = "Container images for the lucaszanoni-web micro-frontends, pushed by keyless GitHub Actions continuous delivery."
}

module "shell" {
  source = "../../modules/serverless-cloud-run-app"

  project_id                    = var.project_id
  region                        = var.region
  service_name                  = "lucaszanoni-shell"
  container_image               = var.shell_container_image
  runtime_service_account_email = var.runtime_service_account_email
  mount_path                    = "/"
  edge_shared_secret_value      = var.edge_shared_secret_value
}

module "usage_dashboard" {
  source = "../../modules/serverless-cloud-run-app"

  project_id                    = var.project_id
  region                        = var.region
  service_name                  = "lucaszanoni-usage-dashboard"
  container_image               = var.usage_dashboard_container_image
  runtime_service_account_email = var.runtime_service_account_email
  mount_path                    = "/engineering/dotfiles/claude/usage/"
  edge_shared_secret_value      = var.edge_shared_secret_value
}

module "reports" {
  source = "../../modules/serverless-cloud-run-app"

  project_id                    = var.project_id
  region                        = var.region
  service_name                  = "lucaszanoni-reports"
  container_image               = var.reports_container_image
  runtime_service_account_email = var.runtime_service_account_email
  mount_path                    = "/reports/"
  edge_shared_secret_value      = var.edge_shared_secret_value
}

module "edge" {
  source = "../../modules/cloudflare-edge"
  count  = var.enable_cloudflare_edge ? 1 : 0

  zone_name             = var.domain_name
  cloudflare_account_id = var.cloudflare_account_id
  shell_origin_host     = module.shell.origin_host
  prefix_origin_hosts = {
    "/engineering/dotfiles/claude/usage/" = module.usage_dashboard.origin_host
    "/reports/"                           = module.reports.origin_host
  }
  edge_shared_secret_value = var.edge_shared_secret_value
}
