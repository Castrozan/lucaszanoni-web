# Cloudflare Access Google SSO wiring

The `cloudflare-access` module offers Google as the Cloudflare Access login method for every managed Access application. Whether it is active is derived, not declared: the `google_sso_enabled` local (`main.tf`) is true exactly when both `google_sso_client_id` and `google_sso_client_secret` are non-empty, and the `google_sso_login_enabled` module output (`outputs.tf`) surfaces that signal. While it is true, the Google identity provider is provisioned and every application binds it through `allowed_idps` + `auto_redirect_to_identity`, so a gated route redirects straight to Google instead of Cloudflare's default email one-time-pin. Clearing either credential flips the signal back to false and reverts to one-time-pin, so treat "Google sign-in is on" as the current credentials-set state, not a fixed fact. The `main.tf`, `variables.tf`, and `outputs.tf` definitions are authoritative; this document is the wiring contract around them.

Enabling, re-enabling, or rotating Google SSO is a set of owner-only actions: they touch the owner's Cloudflare and Google consoles, the public team subdomain, and the Cloudflare token scope, none of which CI can perform. They are recorded here so an owner can repeat them.

## The team subdomain naming contract

Cloudflare Access runs under a team subdomain `<team>.cloudflareaccess.com`. It is public and semi-permanent, because it is baked into the Google OAuth redirect URI:

```
https://<team>.cloudflareaccess.com/cdn-cgi/access/callback
```

Renaming the team breaks the OAuth client until the redirect URI is updated to match. The team name matching the platform brand is `lucaszanoni`, giving `lucaszanoni.cloudflareaccess.com` and the callback `https://lucaszanoni.cloudflareaccess.com/cdn-cgi/access/callback`. The free Zero Trust plan is sufficient.

## The Google OAuth client

Google SSO is backed by an OAuth 2.0 Web Client in the owner's Google Cloud console whose authorized redirect URI is the team callback above. Google issues a client id and a client secret for it. Rotating the secret means issuing a new one on that client and updating the `google_sso_client_secret` input used by the owner-run Access change; the client id and the redirect URI stay put.

## The Google OAuth fields and the Worker deployer

The Worker deployer in `deploy-site` does not read, rotate, or apply the Google OAuth fields. Sign-in works through the Google identity provider configured in Cloudflare Access. The module inputs and their defaults in this repository are not proof of current live state.

This deployment does not consume the GitHub secrets named `GOOGLE_SSO_*`. Their values were not read, and they must not be assumed current. Verify them separately against the active OAuth client before any use.

Changing Google SSO credentials is a separate, explicit owner operation against the active Google and Cloudflare configuration. It is not part of the Worker deploy, not a broad production Terraform apply, and not secret creation with `gcloud`. Both Terraform inputs are sensitive and default to empty values. Never commit credential values.

Asset deployment does not require widening permissions. OAuth maintenance is authorized separately and uses the minimum permissions for the actual operation. The Worker deploy reads Access metadata and never writes OAuth configuration.

## The CD token scope

An owner-run Access change needs a Cloudflare API token with the minimum scopes that operation requires. Managing Access applications and policies requires `Access: Apps and Policies: Edit`. If the Cloudflare organization itself is ever managed declaratively, that also requires `Access: Organizations, Identity Providers, and Groups`. Do not widen a token for asset deployment.
