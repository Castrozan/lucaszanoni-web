# lucaszanoni-web

Personal engineering site for lucaszanoni.com.br. A core React shell at `/` with independently
deployable single-page micro-frontends mounted at nested paths, fronted by a Cloudflare edge that
path-routes each prefix to its own scale-to-zero Cloud Run service.

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
