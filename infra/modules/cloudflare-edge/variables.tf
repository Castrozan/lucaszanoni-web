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

variable "static_bucket_prefix_origins" {
  type = map(object({
    bucket            = string
    object_key_prefix = string
  }))
  default     = {}
  description = "Map of edge path prefix to a public GCS bucket origin that serves it as pre-rendered static content. The Worker matches these prefixes before the Cloud Run prefixes and fetches the bucket object directly without the shared-secret header, resolving a trailing-slash request to the prefix's index.html. Empty by default; populated only once the static reports artifacts are re-homed to the bucket."
}

variable "external_https_prefix_origins" {
  type = map(object({
    origin_host         = string
    path_rewrite        = string
    forwarded_base_path = string
    trusted             = bool
  }))
  default     = {}
  description = "Map of edge path prefix to an external HTTPS origin hosted outside this repo. The Worker matches these prefixes after the static-bucket prefixes and before the Cloud Run prefixes, rewrites the host to the external origin, strips any inbound copy of the in-repo shared-secret header, and never injects the shared-secret header. path_rewrite preserve forwards the path unchanged; strip-mount-path replaces the matched prefix with forwarded_base_path, which must be empty or both start and end with a slash. A trusted origin receives the forwarded Cloudflare Access identity assertion header; an untrusted origin has that header stripped and is edge-gated only. Because the Worker runs after Cloudflare Access and cannot tell an Access-injected assertion from a client-supplied one, trusted may be set only for a route already gated by a Cloudflare Access application that overwrites any client-supplied assertion; marking an origin trusted before its Access gate exists would forward a client-forged identity. Empty by default; populated once an external-https app is registered."
}

variable "edge_shared_secret_header_name" {
  type    = string
  default = "X-Edge-Auth"
}

variable "edge_shared_secret_value" {
  type      = string
  sensitive = true
}

variable "alias_redirect" {
  type = object({
    zone_name      = string
    canonical_host = string
    status_code    = number
  })
  default     = null
  description = "Optional alias zone whose every request the edge Worker permanently redirects to the canonical host, path and query preserved. When set, the module attaches the same Worker to the alias zone via its own proxied apex record and route, and injects the redirect into the routing table; null leaves the alias unmanaged. Re-homing the redirect onto the Worker keeps it within the Workers Routes and Scripts token scope, avoiding the Dynamic Redirect ruleset permission group."
}
