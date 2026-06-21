resource "google_cloud_run_v2_service" "this" {
  name     = var.service_name
  location = var.region
  project  = var.project_id
  ingress  = "INGRESS_TRAFFIC_ALL"

  deletion_protection = false

  template {
    service_account = var.runtime_service_account_email

    scaling {
      min_instance_count = 0
      max_instance_count = var.max_instance_count
    }

    containers {
      image = var.container_image

      ports {
        container_port = var.container_port
      }

      resources {
        cpu_idle = true
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      env {
        name  = "EDGE_SHARED_SECRET_HEADER_NAME"
        value = var.edge_shared_secret_header_name
      }

      env {
        name  = "EDGE_SHARED_SECRET_VALUE"
        value = var.edge_shared_secret_value
      }

      dynamic "env" {
        for_each = var.non_secret_environment_variables
        content {
          name  = env.key
          value = env.value
        }
      }

      dynamic "env" {
        for_each = var.secret_environment_variable_references
        content {
          name = env.key
          value_source {
            secret_key_ref {
              secret  = env.value
              version = "latest"
            }
          }
        }
      }
    }
  }

  labels = {
    mount_path = coalesce(replace(trim(var.mount_path, "/"), "/", "-"), "root")
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
      template[0].revision,
      client,
      client_version,
      scaling,
    ]
  }
}

resource "google_cloud_run_v2_service_iam_member" "public_invoker" {
  name     = google_cloud_run_v2_service.this.name
  location = google_cloud_run_v2_service.this.location
  project  = var.project_id
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_secret_manager_secret_iam_member" "runtime_secret_accessor" {
  for_each = toset(values(var.secret_environment_variable_references))

  project   = var.project_id
  secret_id = each.value
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${var.runtime_service_account_email}"
}
