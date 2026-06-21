# atrium

Atrium is the personal web app platform behind the lucaszanoni brand's canonical domain: a core React shell at `/` that
hosts independently deployable single-page apps, each mounted at its own path prefix or subdomain and
fronted by a Cloudflare edge that routes it to its own scale-to-zero Cloud Run service or to an
attached external origin gated by Cloudflare Access.

To add, gate, or ship an app, follow the maintainer guide at `docs/integration.md`.

## Layout

- `apps/` — the in-repo micro-frontends, one directory per `in-repo-cloud-run` app. The registered app set and every mount path live in `packages/config/src/app-registry.json` (shape fixed by `app-registry.schema.json`), the single source of truth every consumer derives from.
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

Every in-repo service runs scale-to-zero on Cloud Run, so the idle platform carries no standing compute cost; `infra/COST-CEILINGS.md` owns the enforced cost ceilings and the request budget. Secrets never live in the public registry: an in-repo app declares plain runtime config through `nonSecretEnvironment` and Google Secret Manager references through `secretEnvironmentReferences`, with both field shapes fixed by `packages/config/src/app-registry.schema.json`. Only non-secret ids travel through the repo; secret values are created out of band and read at deploy time.
