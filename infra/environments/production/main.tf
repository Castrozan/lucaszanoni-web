locals {
  app_registry = jsondecode(file("${path.root}/../../../packages/config/src/app-registry.json"))

  in_repo_cloud_run_apps = {
    for app in local.app_registry :
    app.id => app
    if app.origin.kind == "in-repo-cloud-run"
  }

  in_repo_app_container_images = {
    shell             = var.shell_container_image
    "usage-dashboard" = var.usage_dashboard_container_image
    reports           = var.reports_container_image
    cockpit           = var.cockpit_container_image
  }

  root_app_id = one([
    for app_id, app in local.in_repo_cloud_run_apps : app_id
    if app.mountPath == "/"
  ])

  prefix_origin_hosts = {
    for app_id, app in local.in_repo_cloud_run_apps :
    app.mountPath => module.in_repo_cloud_run_app[app_id].origin_host
    if app.mountPath != "/" && try(app.servingLocation.kind, "path-prefix") != "subdomain"
  }

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

  non_public_apps = {
    for app in local.app_registry :
    app.id => {
      mount_path        = app.mountPath
      access_model_kind = app.accessModel.kind
      audience_key      = try(app.accessModel.audienceKey, "")
    }
    if app.accessModel.kind != "public"
  }

  retired_app_mount_prefixes = [
    for app in local.app_registry : app.mountPath
    if try(app.status, "active") == "retired"
  ]

  subdomain_apps = {
    for app in local.app_registry :
    app.servingLocation.subdomainLabel => {
      origin_host = (
        app.origin.kind == "in-repo-cloud-run"
        ? module.in_repo_cloud_run_app[app.id].origin_host
        : app.origin.originHost
      )
      origin_kind = app.origin.kind
      trusted     = try(app.origin.trusted, false)
    }
    if try(app.servingLocation.kind, "path-prefix") == "subdomain"
  }

  edge_serving_domain = var.enable_dotcom_canonical ? var.canonical_domain_name : var.domain_name
}

module "in_repo_cloud_run_app" {
  source   = "../../modules/serverless-cloud-run-app"
  for_each = local.in_repo_cloud_run_apps

  project_id                             = var.project_id
  region                                 = var.region
  service_name                           = each.value.origin.cloudRunServiceName
  container_image                        = local.in_repo_app_container_images[each.key]
  runtime_service_account_email          = var.runtime_service_account_email
  mount_path                             = each.value.mountPath
  edge_shared_secret_value               = var.edge_shared_secret_value
  non_secret_environment_variables       = each.value.origin.nonSecretEnvironment
  secret_environment_variable_references = each.value.origin.secretEnvironmentReferences
}

moved {
  from = module.shell
  to   = module.in_repo_cloud_run_app["shell"]
}

moved {
  from = module.usage_dashboard
  to   = module.in_repo_cloud_run_app["usage-dashboard"]
}

moved {
  from = module.reports
  to   = module.in_repo_cloud_run_app["reports"]
}

module "edge" {
  source = "../../modules/cloudflare-edge"
  count  = var.enable_cloudflare_edge ? 1 : 0

  zone_name             = local.edge_serving_domain
  cloudflare_account_id = var.cloudflare_account_id
  shell_origin_host     = module.in_repo_cloud_run_app[local.root_app_id].origin_host
  prefix_origin_hosts   = local.prefix_origin_hosts
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
  external_https_prefix_origins = local.external_https_prefix_origins
  retired_prefixes              = local.retired_app_mount_prefixes
  subdomain_apps                = local.subdomain_apps
  edge_shared_secret_value      = var.edge_shared_secret_value
  alias_redirect = var.enable_dotcom_canonical ? {
    zone_name      = var.domain_name
    canonical_host = var.canonical_domain_name
    status_code    = 301
  } : null
}

module "access" {
  source = "../../modules/cloudflare-access"
  count  = var.enable_cloudflare_edge ? 1 : 0

  cloudflare_account_id                   = var.cloudflare_account_id
  zone_name                               = local.edge_serving_domain
  non_public_apps                         = local.non_public_apps
  owner_account_email                     = var.owner_account_email
  shared_access_audience_email_allowlists = var.shared_access_audience_email_allowlists
  google_sso_client_id                    = var.google_sso_client_id
  google_sso_client_secret                = var.google_sso_client_secret
}

module "jarvis_session_tunnel" {
  source = "../../modules/cloudflare-jarvis-tunnel"
  count  = var.enable_jarvis_session_tunnel ? 1 : 0

  cloudflare_account_id = var.cloudflare_account_id
  zone_name             = local.edge_serving_domain
  origin_hostname       = "jarvis-session-origin.${local.edge_serving_domain}"
  tunnel_secret         = var.jarvis_session_tunnel_secret
}
