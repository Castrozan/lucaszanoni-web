variable "zone_name" {
  type        = string
  description = "The alias zone whose every request is permanently redirected to the canonical domain."
}

variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare account that owns the alias zone. Scopes the zone data-source lookup so the name match is unambiguous within this account."
}

variable "canonical_domain_name" {
  type        = string
  description = "Canonical domain that every alias request is redirected to, scheme prefixed at the edge with the original path and query preserved."
}

variable "redirect_status_code" {
  type        = number
  default     = 301
  description = "HTTP status for the redirect. 301 marks the canonical move permanent; switch to 302 while the canonical domain is still settling to avoid browsers caching the permanent redirect."
}

variable "proxied_placeholder_origin_ip" {
  type        = string
  default     = "192.0.2.1"
  description = "Documentation-range placeholder for the proxied apex record. The dynamic redirect ruleset answers at the edge before any origin fetch, so this address is never dialed; it exists only to anchor the orange-cloud proxy on the alias hostname so the ruleset can intercept its traffic."
}
