locals {
  app_registry = jsondecode(file("${path.root}/../../../packages/config/src/app-registry.json"))

  private_registry_applications = {
    for app in local.app_registry :
    app.id => {
      application_domain = (
        try(app.servingLocation.kind, "path-prefix") == "subdomain"
        ? "${app.servingLocation.subdomainLabel}.${local.edge_serving_domain}"
        : "${local.edge_serving_domain}${trimsuffix(app.mountPath, "/")}"
      )
      audience_kind = try(app.accessModel.audience.kind, "owner")
      audience_key  = try(app.accessModel.audience.audienceKey, "")
    }
    if app.accessModel.environment != "public" && try(app.accessApplicationProvisioning.kind, "dedicated") != "inherited-from-parent-path"
  }

  subdomain_labels = toset([
    for app in local.app_registry : app.servingLocation.subdomainLabel
    if try(app.servingLocation.kind, "path-prefix") == "subdomain"
  ])

  edge_serving_domain = var.enable_dotcom_canonical ? var.canonical_domain_name : var.domain_name
}

module "edge" {
  source = "../../modules/cloudflare-edge"
  count  = var.enable_cloudflare_edge ? 1 : 0

  zone_name             = local.edge_serving_domain
  cloudflare_account_id = var.cloudflare_account_id
  subdomain_labels      = local.subdomain_labels
  alias_zone_name       = var.enable_dotcom_canonical ? var.domain_name : null
}

module "access" {
  source = "../../modules/cloudflare-access"
  count  = var.enable_cloudflare_edge ? 1 : 0

  cloudflare_account_id = var.cloudflare_account_id
  private_applications = merge(
    local.private_registry_applications,
    local.arr_stack_media_private_applications,
  )
  owner_account_email                     = var.owner_account_email
  shared_access_audience_email_allowlists = var.shared_access_audience_email_allowlists
  google_sso_client_id                    = var.google_sso_client_id
  google_sso_client_secret                = var.google_sso_client_secret
}
