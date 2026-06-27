variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare account that owns the serving zone and the managed Access applications."
}

variable "zone_name" {
  type        = string
  description = "Serving zone whose hostnames the Access applications protect. Combined with each app mount path it forms the host-and-path domain Cloudflare Access gates at the edge, before the routing Worker runs."
}

variable "private_environment_apps" {
  type = map(object({
    mount_path    = string
    audience_kind = string
    audience_key  = optional(string, "")
  }))
  default     = {}
  description = "Map of registry app id to the private-environment app descriptor whose edge hostname Cloudflare Access gates. audience_kind is owner or shared; an owner audience resolves its allowlist to the single owner email, a shared audience resolves to the email allowlist of its audience_key. Empty by default so the module provisions nothing until a private-environment app is registered."
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

variable "google_sso_client_id" {
  type        = string
  default     = ""
  sensitive   = true
  description = "OAuth 2.0 client id of the Google identity provider Cloudflare Access offers as the login method for every managed application. Injected at apply time via TF_VAR_google_sso_client_id from a CI secret and never committed. While empty, no Google identity provider is provisioned and each application keeps Cloudflare's default email one-time-pin login, so Google sign-in is opt-in and reversible."
}

variable "google_sso_client_secret" {
  type        = string
  default     = ""
  sensitive   = true
  description = "OAuth 2.0 client secret paired with google_sso_client_id. Injected at apply time via TF_VAR_google_sso_client_secret from a CI secret and never committed. An empty client id or secret disables the Google identity provider."
}
