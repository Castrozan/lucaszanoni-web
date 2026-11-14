locals {
  app_registry = jsondecode(file("${path.root}/../../../packages/config/src/app-registry.json"))

  external_https_apps = {
    for app in local.app_registry :
    app.id => app
    if app.origin.kind == "external-https"
  }

  external_https_prefix_origins = {
    for app_id, app in local.external_https_apps :
    app.mountPath => {
      origin_host         = app.origin.originHost
      path_rewrite        = app.origin.pathRewrite
      forwarded_base_path = app.origin.forwardedBasePath
      trusted             = app.origin.trusted
    }
    if try(app.servingLocation.kind, "path-prefix") != "subdomain"
  }

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

  retired_app_mount_prefixes = [
    for app in local.app_registry : app.mountPath
    if try(app.status, "active") == "retired"
  ]

  subdomain_apps = {
    for app in local.app_registry :
    app.servingLocation.subdomainLabel => {
      origin_host = app.origin.originHost
      origin_kind = app.origin.kind
      trusted     = try(app.origin.trusted, false)
    }
    if try(app.servingLocation.kind, "path-prefix") == "subdomain"
  }

  edge_serving_domain = var.enable_dotcom_canonical ? var.canonical_domain_name : var.domain_name
}

module "edge" {
  source = "../../modules/cloudflare-edge"
  count  = var.enable_cloudflare_edge ? 1 : 0

  zone_name             = local.edge_serving_domain
  cloudflare_account_id = var.cloudflare_account_id
  prefix_origin_hosts   = {}
  worker_service_prefixes = {
    for app in local.app_registry : app.mountPath => "APP_${upper(replace(app.id, "-", "_"))}"
    if app.origin.kind == "cloudflare-worker" && app.status == "active"
  }
  worker_services = {
    for app in local.app_registry : "APP_${upper(replace(app.id, "-", "_"))}" => app.origin.scriptName
    if app.origin.kind == "cloudflare-worker" && app.status == "active"
  }
  external_https_prefix_origins = merge(
    local.external_https_prefix_origins,
    local.cockpit_session_external_https_origins
  )
  retired_prefixes         = local.retired_app_mount_prefixes
  subdomain_apps           = local.subdomain_apps
  edge_shared_secret_value = var.edge_shared_secret_value
  alias_redirect = var.enable_dotcom_canonical ? {
    zone_name      = var.domain_name
    canonical_host = var.canonical_domain_name
    status_code    = 301
  } : null
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
