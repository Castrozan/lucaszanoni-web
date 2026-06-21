variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "service_name" {
  type = string
}

variable "container_image" {
  type = string
}

variable "runtime_service_account_email" {
  type        = string
  description = "Cloud Run runtime identity the service executes as, created in the GCP federation state and referenced here by email."
}

variable "mount_path" {
  type        = string
  description = "Edge path prefix this service answers, recorded as a label for traceability."
}

variable "max_instance_count" {
  type    = number
  default = 2
}

variable "container_port" {
  type    = number
  default = 8080
}

variable "edge_shared_secret_header_name" {
  type    = string
  default = "X-Edge-Auth"
}

variable "edge_shared_secret_value" {
  type      = string
  sensitive = true
}

variable "non_secret_environment_variables" {
  type        = map(string)
  default     = {}
  description = "Non-secret plain environment variables rendered into the Cloud Run container, sourced from the registry origin's nonSecretEnvironment map. Secret material never travels through here; secret references are injected separately so the public registry stays free of secrets."
}

variable "secret_environment_variable_references" {
  type        = map(string)
  default     = {}
  description = "Map of container environment variable name to the Google Secret Manager secret id that supplies its value, sourced from the registry origin's secretEnvironmentReferences map. The registry carries only the non-secret secret id; the value lives in Secret Manager and is read at deploy time, so the public registry never holds secret material. The runtime service account is granted secretAccessor on each referenced secret."
}
