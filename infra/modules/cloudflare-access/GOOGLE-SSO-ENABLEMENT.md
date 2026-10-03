# Cloudflare Access Google SSO wiring

The `cloudflare-access` module offers Google as the Cloudflare Access login method for every managed Access application. Whether it is active is derived, not declared: the `google_sso_enabled` local (`main.tf`) is true exactly when both `google_sso_client_id` and `google_sso_client_secret` are non-empty, and the `google_sso_login_enabled` module output (`outputs.tf`) surfaces that signal. While it is true, the Google identity provider is provisioned and every application binds it through `allowed_idps` + `auto_redirect_to_identity`, so a gated route redirects straight to Google instead of Cloudflare's default email one-time-pin. Clearing either credential flips the signal back to false and reverts to one-time-pin, so treat "Google sign-in is on" as the current credentials-set state, not a fixed fact. The `main.tf`, `variables.tf`, and `outputs.tf` definitions are authoritative; this document is the wiring contract around them.

Enabling, re-enabling, or rotating Google SSO is a set of owner-only actions: they touch the owner's Cloudflare and Google consoles, the public team subdomain, and the CD token scope, none of which the agent's keyless CI can perform. They are recorded here so an owner can repeat them.

## The team subdomain naming contract

Cloudflare Access runs under a team subdomain `<team>.cloudflareaccess.com`. It is public and semi-permanent, because it is baked into the Google OAuth redirect URI:

```
https://<team>.cloudflareaccess.com/cdn-cgi/access/callback
```

Renaming the team breaks the OAuth client until the redirect URI is updated to match. The team name matching the platform brand is `lucaszanoni`, giving `lucaszanoni.cloudflareaccess.com` and the callback `https://lucaszanoni.cloudflareaccess.com/cdn-cgi/access/callback`. The free Zero Trust plan is sufficient.

## The Google OAuth client

Google SSO is backed by an OAuth 2.0 Web Client in the owner's Google Cloud console whose authorized redirect URI is the team callback above. Google issues a client id and a client secret for it. Rotating the secret means issuing a new one on that client and updating the CI secret below; the client id and the redirect URI stay put.

## The secret-name wiring contract

The protected GitLab file variable `PRODUCTION_TERRAFORM_VARIABLES` contains the production Terraform variables as JSON. Its `google_sso_client_id` and `google_sso_client_secret` fields supply the Google OAuth credentials.

The infrastructure job in `.gitlab/ci/production.yml` passes that file to `terraform plan`; apply consumes the saved plan. Rotate the fields in the protected variable while preserving the other production settings. Both Terraform inputs are sensitive and default to empty values. Never commit the variable file.

## The CD token scope

The single `CLOUDFLARE_API_TOKEN` used by CD must carry `Access: Apps and Policies: Edit` to manage the applications, policies, and the identity provider. If the Cloudflare organization itself is ever managed declaratively, it additionally needs `Access: Organizations, Identity Providers, and Groups`. Widen the token in the Cloudflare dashboard if it lacks the scope.
