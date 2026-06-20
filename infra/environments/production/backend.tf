terraform {
  backend "gcs" {
    bucket = "zg-url-shortener-2026-lucaszanoni-web-tfstate"
    prefix = "production"
  }
}
