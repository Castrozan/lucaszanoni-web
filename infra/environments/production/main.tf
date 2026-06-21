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
  mount_path                    = "/engineering/dotfiles/reports/"
  edge_shared_secret_value      = var.edge_shared_secret_value
}

locals {
  edge_serving_domain = var.enable_dotcom_canonical ? var.canonical_domain_name : var.domain_name
}

module "edge" {
  source = "../../modules/cloudflare-edge"
  count  = var.enable_cloudflare_edge ? 1 : 0

  zone_name             = local.edge_serving_domain
  cloudflare_account_id = var.cloudflare_account_id
  shell_origin_host     = module.shell.origin_host
  prefix_origin_hosts = {
    "/engineering/dotfiles/claude/usage/" = module.usage_dashboard.origin_host
    "/engineering/dotfiles/reports/"      = module.reports.origin_host
  }
  static_bucket_prefix_origins = var.enable_reports_static_gcs_routes ? {
    "/engineering/dotfiles/reports/baseline/" = {
      bucket            = var.reports_static_bucket_name
      object_key_prefix = "reports/baseline/"
    }
    "/engineering/dotfiles/reports/coverage/" = {
      bucket            = var.reports_static_bucket_name
      object_key_prefix = "reports/coverage/"
    }
  } : {}
  edge_shared_secret_value = var.edge_shared_secret_value
  alias_redirect = var.enable_dotcom_canonical ? {
    zone_name      = var.domain_name
    canonical_host = var.canonical_domain_name
    status_code    = 301
  } : null
}
