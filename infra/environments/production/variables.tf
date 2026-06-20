variable "project_id" {
  type    = string
  default = "zg-url-shortener-2026"
}

variable "region" {
  type    = string
  default = "southamerica-east1"
}

variable "domain_name" {
  type    = string
  default = "lucaszanoni.com.br"
}

variable "shell_container_image" {
  type        = string
  description = "Fully qualified Artifact Registry image for the shell service. Real app images are pushed out-of-band by CD; Terraform ignores image drift, so this seeds the first revision only."
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

variable "usage_dashboard_container_image" {
  type        = string
  description = "Fully qualified Artifact Registry image for the usage-dashboard service. Real app images are pushed out-of-band by CD; Terraform ignores image drift, so this seeds the first revision only."
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

variable "reports_container_image" {
  type        = string
  description = "Fully qualified Artifact Registry image for the reports service. Real app images are pushed out-of-band by CD; Terraform ignores image drift, so this seeds the first revision only."
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

variable "edge_shared_secret_value" {
  type        = string
  sensitive   = true
  description = "Shared secret the Cloudflare edge injects and each Cloud Run service requires before serving."
}

variable "runtime_service_account_email" {
  type        = string
  default     = "lucaszanoni-web-runtime@zg-url-shortener-2026.iam.gserviceaccount.com"
  description = "Shared Cloud Run runtime identity for the platform services, owned by the GCP federation state."
}
