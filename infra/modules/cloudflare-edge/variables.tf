variable "zone_name" {
  type = string
}

variable "shell_origin_host" {
  type        = string
  description = "Cloud Run host that answers the catch-all root prefix."
}

variable "prefix_origin_hosts" {
  type        = map(string)
  description = "Map of edge path prefix to the Cloud Run host that serves it, most specific routed last."
}

variable "edge_shared_secret_header_name" {
  type    = string
  default = "X-Edge-Auth"
}

variable "edge_shared_secret_value" {
  type      = string
  sensitive = true
}
