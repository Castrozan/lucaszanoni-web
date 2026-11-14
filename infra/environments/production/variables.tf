variable "project_id" {
  type    = string
  default = "zg-url-shortener-2026"
}

variable "region" {
  type    = string
  default = "southamerica-east1"
}

variable "domain_name" {
  type    = string
  default = "lucaszanoni.com.br"
}

variable "canonical_domain_name" {
  type        = string
  default     = "lucaszanoni.com"
  description = "Primary public domain for the platform. When enable_dotcom_canonical is on, the edge serves this zone and the domain_name zone is reduced to a permanent redirect alias pointing here."
}

variable "enable_cloudflare_edge" {
  type        = bool
  default     = false
  description = "Whether to provision the Cloudflare zone and edge rulesets. Defaults off so the GCP services apply keyless without the Cloudflare token; flipped on once the token is minted, with no domain cutover until Phase 6."
}

variable "enable_dotcom_canonical" {
  type        = bool
  default     = false
  description = "Whether lucaszanoni.com is the canonical edge domain with lucaszanoni.com.br reduced to a permanent redirect alias. Defaults off so the live edge keeps serving the .com.br zone unchanged; flipped on only after the Cloudflare API token is widened to include the lucaszanoni.com zone, since the serving-zone resources cannot be written there until then."
}

variable "edge_shared_secret_value" {
  type        = string
  sensitive   = true
  description = "Shared secret the Cloudflare edge injects into requests it proxies to an owned origin host."
}

variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare account that owns the lucaszanoni.com.br zone. Supplied at apply time via TF_VAR_cloudflare_account_id; never committed, to keep account identifiers out of the public repo."
}

variable "owner_account_email" {
  type        = string
  default     = ""
  sensitive   = true
  description = "Email of the sole platform owner, included by every owner-only Cloudflare Access policy. Supplied at apply time via TF_VAR_owner_account_email from a CI secret and never committed, to keep the owner's address out of the public repo. While empty, any owner-only app fails its Access policy precondition at plan."
}

variable "shared_access_audience_email_allowlists" {
  type        = map(list(string))
  default     = {}
  sensitive   = true
  description = "Map of audience key to the email allowlist included by every shared Cloudflare Access policy bound to that audience. Supplied at apply time via TF_VAR_shared_access_audience_email_allowlists from a CI secret and never committed. While an audience key resolves to an empty list, any shared app on that audience fails its Access policy precondition at plan."
}

variable "google_sso_client_id" {
  type        = string
  default     = ""
  sensitive   = true
  description = "OAuth 2.0 client id of the Google identity provider Cloudflare Access offers as the login method for the managed Access applications. Supplied at apply time via TF_VAR_google_sso_client_id from a CI secret and never committed. Empty leaves Access on its default email one-time-pin login."
}

variable "google_sso_client_secret" {
  type        = string
  default     = ""
  sensitive   = true
  description = "OAuth 2.0 client secret paired with google_sso_client_id. Supplied at apply time via TF_VAR_google_sso_client_secret from a CI secret and never committed."
}

variable "enable_jarvis_session_tunnel" {
  type        = bool
  default     = false
  description = "Whether to provision the locally-managed Cloudflare Tunnel that publishes the owner-only cockpit Jarvis session bridge on chise to the edge. Defaults off so a push applies no public origin; flipped on together with jarvis_session_tunnel_secret only once the connector credentials are minted into chise's agenix store, which is the single irreversible step that exposes the Access-gated session shell."
}

variable "jarvis_session_tunnel_secret" {
  type        = string
  sensitive   = true
  default     = ""
  description = "Base64-encoded 32-byte secret that authenticates chise's cloudflared connector to the named Jarvis tunnel. Supplied at apply time via TF_VAR_jarvis_session_tunnel_secret from a CI secret and never committed; the same value is marshalled into the connector credentials JSON output for the agenix handoff. Ignored while enable_jarvis_session_tunnel is off."
}

variable "enable_kira_session_tunnel" {
  type        = bool
  default     = false
  description = "Whether to provision the locally-managed Cloudflare Tunnel that publishes kira's own cockpit session bridge (the owner's laptop, serving its own tmux sessions directly) to the edge, so the workspace connects to kira without the chise SSH relay. Defaults off so a push applies no public origin; flipped on together with kira_session_tunnel_secret once the connector credentials are minted into kira's agenix store."
}

variable "kira_session_tunnel_secret" {
  type        = string
  sensitive   = true
  default     = ""
  description = "Base64-encoded 32-byte secret that authenticates kira's cloudflared connector to the named kira tunnel. Supplied at apply time via TF_VAR_kira_session_tunnel_secret from a CI secret and never committed; the same value is marshalled into the connector credentials JSON for the agenix handoff. Ignored while enable_kira_session_tunnel is off."
}

variable "enable_rin_session_tunnel" {
  type        = bool
  default     = false
  description = "Whether to provision the locally-managed Cloudflare Tunnel that publishes rin's own cockpit session bridge (serving its own tmux sessions directly) to the edge, so the workspace connects to rin without the chise SSH relay. Defaults off so a push applies no public origin; flipped on together with rin_session_tunnel_secret once the connector credentials are minted into rin's agenix store."
}

variable "rin_session_tunnel_secret" {
  type        = string
  sensitive   = true
  default     = ""
  description = "Base64-encoded 32-byte secret that authenticates rin's cloudflared connector to the named rin tunnel. Supplied at apply time via TF_VAR_rin_session_tunnel_secret from a CI secret and never committed; the same value is marshalled into the connector credentials JSON for the agenix handoff. Ignored while enable_rin_session_tunnel is off."
}
