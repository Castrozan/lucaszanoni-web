variable "zone_name" {
  type = string
}

variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare account that owns the pre-existing zone. Scopes the zone data-source lookup so the name match is unambiguous within this account."
}

variable "proxied_placeholder_origin_ip" {
  type        = string
  default     = "192.0.2.1"
  description = "Documentation-range placeholder address for the proxied apex record. The edge Worker intercepts every request on the zone route and fetches the matching Cloud Run origin, so this address is never dialed; it exists only to anchor the orange-cloud proxy on the apex hostname."
}

variable "shell_origin_host" {
  type        = string
  description = "Cloud Run host that answers the catch-all root prefix."
}

variable "prefix_origin_hosts" {
  type        = map(string)
  description = "Map of edge path prefix to the Cloud Run host that serves it. Prefixes are non-overlapping, so the Worker matches the first prefix the request path starts with and falls back to the shell origin when none match."
}

variable "edge_shared_secret_header_name" {
  type    = string
  default = "X-Edge-Auth"
}

variable "edge_shared_secret_value" {
  type      = string
  sensitive = true
}
