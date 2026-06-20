terraform {
  backend "gcs" {
    bucket = "zg-url-shortener-2026-terraform-state"
    prefix = "lucaszanoni-web/production"
  }
}
