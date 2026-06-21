# atrium

Atrium is the personal web app platform behind lucaszanoni.com.br: a core React shell at `/` that
hosts independently deployable single-page apps, each mounted at its own path prefix or subdomain and
fronted by a Cloudflare edge that routes it to its own scale-to-zero Cloud Run service or to an
attached external origin gated by Cloudflare Access.

## Layout

- `apps/shell` — the root landing and navigation shell, served at `/`.
- `apps/usage-dashboard` — the Claude Code usage dashboard, served at `/engineering/dotfiles/claude/usage/`.
- `apps/reports` — the reports hub, served at `/reports/`.
- `packages/` — shared workspace packages (config, design system, snapshot data, tooling config).
- `infra/` — Terraform modules and the production environment.
- `.github/workflows/` — keyless continuous deployment to Google Cloud and the Cloudflare edge.

## Toolchain

pnpm workspaces orchestrated by Turborepo. pnpm is provided by corepack and pinned through the root
`packageManager` field. Use `corepack pnpm <command>` when the pnpm shim is not on the path.

```
corepack pnpm install
corepack pnpm build
corepack pnpm test
```

## Cost and secret posture

Every in-repo service runs scale-to-zero on Cloud Run: no always-on instance, no standing
compute cost when idle. The platform deliberately keeps no always-on database. An app that needs
persistence reaches for a serverless or external managed store that bills per request rather than
for an idle instance, so the whole site stays inside the free tier at rest.

Secrets never live in the public registry. An in-repo app declares the plain runtime configuration
it needs through `nonSecretEnvironment` (literal values) and the secrets it needs through
`secretEnvironmentReferences`, a map from environment variable name to a Google Secret Manager
secret id. Only the non-secret id travels through the registry and this repository; the secret
value is created out of band in Secret Manager and read at deploy time, and the runtime service
account is granted access to exactly the referenced secrets.
