resource "google_storage_bucket_iam_member" "ingest_snapshot_object_writer" {
  bucket = var.reports_static_bucket_name
  role   = "roles/storage.objectUser"
  member = "serviceAccount:${var.runtime_service_account_email}"
}
