resource "google_cloud_run_v2_service" "this" {
  name     = var.service_name
  location = var.region
  project  = var.project_id
  ingress  = "INGRESS_TRAFFIC_ALL"

  deletion_protection = false

  template {
    scaling {
      min_instance_count = 0
      max_instance_count = var.max_instance_count
    }

    containers {
      image = var.container_image

      ports {
        container_port = var.container_port
      }

      env {
        name  = "EDGE_SHARED_SECRET_HEADER_NAME"
        value = var.edge_shared_secret_header_name
      }

      env {
        name  = "EDGE_SHARED_SECRET_VALUE"
        value = var.edge_shared_secret_value
      }
    }
  }

  labels = {
    mount_path = replace(trim(var.mount_path, "/"), "/", "-")
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
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
