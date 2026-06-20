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
