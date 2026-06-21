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

variable "shell_container_image" {
  type        = string
  description = "Fully qualified Artifact Registry image for the shell service. Real app images are pushed out-of-band by CD; Terraform ignores image drift, so this seeds the first revision only."
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

variable "usage_dashboard_container_image" {
  type        = string
  description = "Fully qualified Artifact Registry image for the usage-dashboard service. Real app images are pushed out-of-band by CD; Terraform ignores image drift, so this seeds the first revision only."
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

variable "reports_container_image" {
  type        = string
  description = "Fully qualified Artifact Registry image for the reports service. Real app images are pushed out-of-band by CD; Terraform ignores image drift, so this seeds the first revision only."
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

variable "cockpit_container_image" {
  type        = string
  description = "Fully qualified Artifact Registry image for the cockpit service. Real app images are pushed out-of-band by CD; Terraform ignores image drift, so this seeds the first revision only."
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
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

variable "enable_reports_static_gcs_routes" {
  type        = bool
  default     = false
  description = "Whether the edge serves /engineering/dotfiles/reports/baseline/ and /engineering/dotfiles/reports/coverage/ from the public GCS bucket. Defaults off so the routes stay dark until the dotfiles pipeline has published the generated baseline and coverage trees to the bucket; while off the Worker falls those paths through to the reports SPA, so flipping it is the only behavior change."
}

variable "reports_static_bucket_name" {
  type        = string
  default     = "zg-url-shortener-2026-dotfiles-usage-snapshots"
  description = "Public GCS bucket holding the re-homed reports baseline and coverage trees under the reports/ prefix. Already public for the usage dashboard's client-side snapshot fetch, so naming it here exposes no new identifier."
}

variable "edge_shared_secret_value" {
  type        = string
  sensitive   = true
  description = "Shared secret the Cloudflare edge injects and each Cloud Run service requires before serving."
}

variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare account that owns the lucaszanoni.com.br zone. Supplied at apply time via TF_VAR_cloudflare_account_id; never committed, to keep account identifiers out of the public repo."
}

variable "runtime_service_account_email" {
  type        = string
  default     = "lucaszanoni-web-runtime@zg-url-shortener-2026.iam.gserviceaccount.com"
  description = "Shared Cloud Run runtime identity for the platform services, owned by the GCP federation state."
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
