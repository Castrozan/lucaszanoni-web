removed {
  from = google_storage_bucket_iam_member.ingest_snapshot_object_writer

  lifecycle {
    destroy = false
  }
}
