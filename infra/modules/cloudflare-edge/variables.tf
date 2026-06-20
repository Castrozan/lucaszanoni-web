variable "zone_name" {
  type = string
}

variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare account that owns the created zone. Required because the module creates the zone rather than referencing a pre-existing one, so the API token must permit zone creation in this account."
}

variable "proxied_placeholder_origin_ip" {
  type        = string
  default     = "192.0.2.1"
  description = "Documentation-range placeholder address for the proxied apex record. Every request is re-homed by the origin router rules, so this address is never dialed; it exists only to anchor the orange-cloud proxy on the apex hostname."
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
