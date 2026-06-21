variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare account that owns the serving zone and the managed Access applications."
}

variable "zone_name" {
  type        = string
  description = "Serving zone whose hostnames the Access applications protect. Combined with each app mount path it forms the host-and-path domain Cloudflare Access gates at the edge, before the routing Worker runs."
}

variable "non_public_apps" {
  type = map(object({
    mount_path        = string
    access_model_kind = string
    audience_key      = optional(string, "")
  }))
  default     = {}
  description = "Map of registry app id to the non-public app descriptor whose edge hostname Cloudflare Access gates. access_model_kind is owner-only or shared; an owner-only app resolves its allowlist to the single owner email, a shared app resolves to the email allowlist of its audience_key. Empty by default so the module provisions nothing until a non-public app is registered."
}

variable "owner_account_email" {
  type        = string
  default     = ""
  sensitive   = true
  description = "Email of the sole platform owner, included by every owner-only Access policy. Injected at apply time via TF_VAR_owner_account_email from a CI secret and never committed, to keep the owner's address out of the public repo. While empty, each owner-only app fails its policy precondition at plan rather than provisioning an Access application with an empty allowlist."
}

variable "shared_access_audience_email_allowlists" {
  type        = map(list(string))
  default     = {}
  sensitive   = true
  description = "Map of audience key to the email allowlist included by every shared Access policy bound to that audience. Injected at apply time via TF_VAR_shared_access_audience_email_allowlists from a CI secret and never committed. While an audience key resolves to an empty list, each shared app on that audience fails its policy precondition at plan."
}

variable "session_duration" {
  type        = string
  default     = "24h"
  description = "Access session lifetime applied to every managed application before the visitor must re-authenticate."
}
