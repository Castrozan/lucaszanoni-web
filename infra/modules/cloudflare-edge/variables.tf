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
  description = "Documentation-range placeholder address for the proxied apex record. The edge Worker intercepts every request on the zone route and serves it from a bound Worker or an external origin, so this address is never dialed; it exists only to anchor the orange-cloud proxy on the apex hostname."
}

variable "subdomain_labels" {
  type        = set(string)
  default     = []
  description = "DNS labels of the apps the registry serves on their own subdomain instead of a shared path prefix. For each label the module stands up a proxied A record at <label>.<zone_name> and attaches the edge Worker via a per-subdomain route; CI deploys the Worker and its host-based routing table. Empty by default, so no subdomain hostnames exist until an app sets its registry servingLocation to subdomain."
}

variable "alias_zone_name" {
  type        = string
  default     = null
  description = "Optional alias zone the edge Worker permanently redirects to the canonical host. When set, the module attaches the same Worker to the alias zone via its own proxied apex record and route; CI deploys the redirect itself in the Worker routing table. Null leaves the alias unmanaged."
}
