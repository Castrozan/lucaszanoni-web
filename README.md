<div align="center">

<h2 align="center"><a href="https://github.com/castrozan" target="_blank" rel="noopener noreferrer">atrium · Zanoni's Personal Platform</a></h2>

<p align="center">
  <img src="https://raw.githubusercontent.com/catppuccin/catppuccin/main/assets/palette/macchiato.png" width="400" />
</p>

<p align="center">
  <a href="https://lucaszanoni.com"><img src="https://img.shields.io/badge/live-lucaszanoni.com-A6E3A1?style=for-the-badge&labelColor=302D41&logo=cloudflare&logoColor=D9E0EE" alt="Live site"></a>
  <img src="https://img.shields.io/badge/TypeScript_5.7-89B4FA?style=for-the-badge&labelColor=302D41&logo=typescript&logoColor=D9E0EE" alt="TypeScript">
  <img src="https://img.shields.io/badge/React_19-89DCEB?style=for-the-badge&labelColor=302D41&logo=react&logoColor=D9E0EE" alt="React">
  <img src="https://img.shields.io/badge/Tailwind_4-C9CBFF?style=for-the-badge&labelColor=302D41&logo=tailwindcss&logoColor=D9E0EE" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Turborepo-F2CDCD?style=for-the-badge&labelColor=302D41&logo=turborepo&logoColor=D9E0EE" alt="Turborepo">
  <img src="https://img.shields.io/badge/Cloudflare_Workers-FAB387?style=for-the-badge&labelColor=302D41&logo=cloudflare&logoColor=D9E0EE" alt="Cloudflare Workers">
  <img src="https://img.shields.io/badge/OpenTofu-CBA6F7?style=for-the-badge&labelColor=302D41&logo=opentofu&logoColor=D9E0EE" alt="OpenTofu">
</p>

</div>

**atrium** is the personal web platform that runs at **[lucaszanoni.com](https://lucaszanoni.com)**. It is a pnpm and Turborepo monorepo of TypeScript and React **micro-frontends** mounted at their own path prefixes or subdomains. Each app's build source is independent of where it is served: the registry declares source, mount, access model and origin separately. Private static apps run as separate private Cloudflare Workers behind standard service bindings from a single **Cloudflare edge Worker**, and Cloudflare Access gates private requests before they reach the Worker. One of the apps is the **cockpit**, an in-browser agent terminal that drives the live tmux and Claude sessions of the owner's machines over each machine's own Cloudflare tunnel, with no SSH relay in the path.

<details>
<summary>✨ What's inside</summary>

<br>

Micro-frontends live in `apps/` and shared code in `packages/`. The registry at `packages/config/src/app-registry.json` is the authority on which apps exist, where they mount and how they are served, and each app's own `package.json` describes its stack. Migrating an app to another target is covered in the [integration guide](docs/integration.md).

</details>

---

## 🏗️ Architecture

Every request lands on the edge Worker. It matches a path prefix or subdomain and forwards to the origin the registry declares for that app. Private static apps are deployed as separate private Cloudflare Workers and reached through standard service bindings; they have no public route of their own, and Cloudflare Access runs before a protected request reaches the Worker. Each app owns its own asset namespace, and deeper external API or WebSocket routes retain precedence over an app's mount. Apps that are not migrated keep their existing targets, such as a static bucket or an external HTTPS origin.

The cockpit reaches each machine over that machine's own cloudflared tunnel using the session-bridge routes declared in the edge configuration.

Cloudflare Access uses two audience kinds, owner-only for a single account and shared for a per-audience email allowlist, with optional Google SSO. The Worker strips Access session cookies from subdomain requests so each subdomain keeps its own same-origin scope. Retired routes return `410 Gone` instead of pointing at a dead origin. [`docs/integration.md`](docs/integration.md) is the migration guide for moving further apps onto the Worker target.

---

## 📂 Repository Layout

The repo is a pnpm workspace driven by Turborepo, and it splits into three areas.

**`apps/`** holds the micro-frontends. Each app has its own build configuration and is built and deployed independently of the others.

**`packages/`** holds the shared code that the apps import. `packages/config/src/app-registry.json` is the single source of truth for which apps exist, where they mount, and how they are served; its schema and types live beside it under `packages/config/src/`. CI and the deploy entry points read from it.

**`infra/`** holds the Terraform and OpenTofu modules for the Cloudflare edge and Access audiences, the retained Google Cloud resources and the per-machine Cloudflare Tunnels. `infra/environments/production/` also provisions Google Cloud and keeps a GCS backend, so it is not a Cloudflare-only deployment command. Alongside these, `.github/workflows/` carries the CI and deploy pipelines and `docs/` carries the maintainer guides.

---

## 🚀 Getting Started

You need the Node version in the root `package.json` `engines` field and the pnpm version pinned by its `packageManager` field, which `corepack` provisions.

```bash
corepack pnpm install     # install the whole workspace
corepack pnpm dev         # turbo run dev across the apps
corepack pnpm build       # turbo run build
corepack pnpm test        # vitest across packages
corepack pnpm lint        # eslint
corepack pnpm typecheck   # tsc project-wide
```

Run a single app by scoping the task, for example `corepack pnpm --filter @platform/cockpit dev`.

GitHub Actions runs `.github/workflows/ci.yml` on pushes and pull requests to `main`. The verification jobs cover the workspace, contract and native smoke checks, the cockpit and shell browser suites, and the Terraform mock-module tests. The `deploy-site` job runs only on a push to `main`, and only after all verification jobs pass; its `needs` list in `.github/workflows/ci.yml` is the canonical gate. It runs `deploy/cloudflare/deploy-site.mjs`, which builds the registry's Cloudflare Worker targets, publishes the private app Workers, then publishes the edge service bindings. Deployment necessarily uploads built assets to private Cloudflare Workers. It logs only SHA-256 hashes and does not publish private bundles as CI artifacts. It does not apply production Terraform or authenticate to Google Cloud, and existing non-Cloudflare targets are left unchanged. The job runs in the `production` GitHub environment, whose deployment branch policy allows only `main`. Before deploying, it runs `deploy/github/verify-production-configuration.mjs`, which checks the canonical `PRODUCTION_TERRAFORM_VARIABLES` JSON secret against the individual environment secrets and the Cloudflare Access Google identity provider, using GET requests only. The cockpit review controls link to pull requests and github.dev on the repository set by `VITE_COCKPIT_REPOSITORY_URL`. Cloudflare credentials come from GitHub secrets; keep credential values outside Git. The synthetic uptime check runs on a schedule in `.github/workflows/synthetic-uptime-check.yml`. `infra/COST-CEILINGS.md` owns the compute and storage limits.

---

Built and run by one person, for one person. If you read this far, you might as well star it ⭐
