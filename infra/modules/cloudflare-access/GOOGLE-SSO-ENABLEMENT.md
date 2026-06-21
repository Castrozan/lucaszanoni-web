# Google SSO enablement runbook

This module wires Google as the Cloudflare Access login method for every managed Access application, but ships it dormant. The `cloudflare_zero_trust_access_identity_provider.google` resource is count-gated on both `google_sso_client_id` and `google_sso_client_secret` being non-empty (`main.tf`), and the applications bind it through `allowed_idps` + `auto_redirect_to_identity` only when that flag is on. With both credentials empty, the identity provider count is zero, so a merge of the wiring changes nothing live and Access keeps its default email one-time-pin login.

Turning Google SSO on is a sequence of owner-only actions. The agent's keyless CI cannot perform them: the steps use the owner's Cloudflare and Google consoles, commit a permanent public team subdomain, and require widening the CD token. They are surfaced here as a checklist rather than applied.

## The account-level blocker

Zero Trust Access has never been onboarded on the Cloudflare account. Until it is, every Access API call (creating an application, a policy, or an identity provider) returns `403 code 9999 access.api.error.not_enabled`. This is an account-state error, not a token-scope or code error, and it blocks both the Google identity provider and any private app that needs an Access gate. Enabling Access is the one prerequisite for everything below.

## Owner steps

### 1. Enable Zero Trust Access and choose the team subdomain

Open the Cloudflare Zero Trust dashboard, run the Enable Access onboarding, and pick a team name. The team name becomes `<team>.cloudflareaccess.com`, a public and semi-permanent identity that is baked into the Google OAuth redirect URI below, so choose it deliberately. The recommended value matching the platform brand is `lucaszanoni`, giving `lucaszanoni.cloudflareaccess.com`. The free Zero Trust plan is sufficient.

### 2. Create a Google OAuth 2.0 Web Client

In the owner's Google Cloud console, create an OAuth 2.0 Client ID of type Web application. Set the authorized redirect URI to the team callback:

```
https://<team>.cloudflareaccess.com/cdn-cgi/access/callback
```

For the recommended team name that is `https://lucaszanoni.cloudflareaccess.com/cdn-cgi/access/callback`. Google issues a client id and a client secret.

### 3. Set the two repo secrets

Set the Google client id and secret as GitHub Actions secrets on this repository. The deploy workflow already plumbs both onto the Terraform plan and apply steps (`.github/workflows/deploy-infrastructure.yml`); nothing else needs to change.

```
GOOGLE_SSO_CLIENT_ID      = <the Google OAuth client id>
GOOGLE_SSO_CLIENT_SECRET  = <the Google OAuth client secret>
```

The client secret is a credential: keep it in the secret only, never in a committed file.

### 4. Confirm the CD token Access scope

The single `CLOUDFLARE_API_TOKEN` used by CD must carry `Access: Apps and Policies: Edit` to manage the applications, policies, and the identity provider. If the org itself is ever managed declaratively, it also needs `Access: Organizations, Identity Providers, and Groups`. Widen the token in the Cloudflare dashboard if it lacks these.

## What happens after

Once Access is enabled and the two secrets are set, the next merge to `main` that re-lands a private app applies its `/`-path route and Access gate atomically, the Google identity provider provisions, and `auto_redirect_to_identity` sends the app straight to the Google login instead of the email one-time-pin. Verify live by loading the protected path: it should redirect to the Google sign-in and, after authenticating as an allowlisted account, return the app. The `google_sso_login_enabled` module output reads `true` once the provider is bound.
