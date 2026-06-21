# Maintaining and expanding atrium

How a maintainer adds an app, gates it, and ships it on the atrium platform (brand `lucaszanoni`). This guide owns the _workflow_; it never restates the field lists, app set, or flag values that drift. The authoritative shapes live in code: the registry JSON Schema (`packages/config/src/app-registry.schema.json`), the TypeScript types and parser (`packages/config/src/app-registry-types.ts`, `app-registry-parser.ts`), and the two deploy workflows (`.github/workflows/deploy-apps.yml`, `deploy-infrastructure.yml`). When this guide and those files disagree, the files win.

For platform shape and toolchain see `README.md`; for cost ceilings see `infra/COST-CEILINGS.md`; for how Google SSO is wired into Cloudflare Access see `infra/modules/cloudflare-access/GOOGLE-SSO-ENABLEMENT.md`.

## Mental model

- **The registry is the single source of truth.** `packages/config/src/app-registry.json` is one JSON array; each element is one app. Every consumer derives from it and nothing else: the typed loader, production Terraform (`infra/environments/production/main.tf` reads it via `jsondecode(file(...))`), the deploy matrix (`deploy/deploy-matrix-from-registry.jq`), the route/navigation projection (`packages/config/src/route-registry.ts`), and the post-deploy edge contract (`deploy/cloudflare/expected-edge-routes-from-registry.jq`). You add or change an app by editing the registry, not a module, a workflow, or the Worker.
- **The entry shape is doubly enforced and must stay in lockstep.** The JSON Schema (draft-07, Ajv) is the declarative contract; the hand-written parser (`parseAppRegistry`) is the runtime gate that throws `AppRegistryValidationError`. Both reject unknown properties at every nesting level (`additionalProperties:false` / `rejectUnknownKeys`). A registry edit must satisfy both, and any change to a field or union must land in both, plus the parser's `requireOneOf` allow-lists.
- **One edge Worker fronts everything.** A single `cloudflare_workers_script` named `lucaszanoni-edge-router` (`infra/modules/cloudflare-edge/main.tf`) is the only edge compute. Its source is one file (`edge-router-worker.mjs`) loaded verbatim, and it is _data-driven_: every routing decision reads the `EDGE_ROUTES` JSON binding that Terraform renders from the registry. The Worker carries no app-specific names. New routing behavior comes from registry data, never from branching on an app inside the Worker, and never from a second Worker. Adding hostnames adds Workers Routes to the same script.
- **Scale-to-zero by construction.** Every in-repo app runs on Cloud Run with `min_instance_count = 0`, `cpu_idle = true`, fixed `1` vCPU / `512Mi`, and a per-service `max_instance_count` (`infra/modules/serverless-cloud-run-app/main.tf`). An idle app costs nothing. See `infra/COST-CEILINGS.md`.
- **Keyless CD.** Both deploy workflows authenticate to Google Cloud via Workload Identity Federation (OIDC, `id-token: write` + `google-github-actions/auth`). No service-account key JSON is stored. The WIF provider path and deployer service account are in the `env:` block at the top of each workflow; treat that block as authoritative rather than memorizing identifiers.
- **The edge is the only door.** Cloud Run services are public-invoker at GCP IAM and `INGRESS_TRAFFIC_ALL`, but reachable only through the Worker, which injects the `EDGE_SHARED_SECRET` header that Cloud Run requires. Access control is the shared-secret header plus Cloudflare Access, never GCP IAM.

## Origin kinds and access models (the two closed unions)

`origin.kind` is a closed union of exactly three kinds; `accessModel.kind` is a closed union of exactly three kinds. Per-field requirements live in the schema (`origin`/`accessModel` definitions) and the parsers (`app-registry-origin-parser.ts`, `parseAccessModel`). How each origin routes and what builds it:

| `origin.kind`       | Built by deploy-apps?                        | How the Worker routes it                                                                                                                                                                                                                                             |
| ------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `in-repo-cloud-run` | Yes (only this kind enters the build matrix) | Path-prefix to the Cloud Run origin host, injecting the shared-secret header; `/` falls back to the shell origin                                                                                                                                                     |
| `external-https`    | No (edge-only)                               | `externalHttpsPrefixes`: rewrites host to `originHost`; if `pathRewrite === "strip-mount-path"` strips the mount prefix and prepends `forwardedBasePath`; deletes the shared-secret header; strips Access cookies; forwards the identity assertion only if `trusted` |
| `static-gcs-bucket` | No (edge-only)                               | `staticBucketPrefixes`: rewrites host to `storage.googleapis.com`, builds the object key, appends `index.html` for a trailing slash, no shared-secret header                                                                                                         |

`accessModel.kind` is `public`, `owner-only`, or `shared`. `shared` carries a non-empty `audienceKey`; `public` and `owner-only` carry only `kind`. Non-public entries project into the Cloudflare Access module, which stands up one Access application + one allow policy per app (`infra/modules/cloudflare-access/main.tf`).

**Two cross-field rules, each enforced in schema and parser:**

- `static-gcs-bucket` ⇒ `public` access model (the bucket object URL bypasses edge auth). Schema `if/then`; parser throw at `app-registry-parser.ts:104`; structurally prevented in the add-app prompt, which offers the bucket choice only when the access model is public.
- `trusted` ⇒ the route is already Access-gated and overwrites client-supplied identity. The Worker forwards `Cf-Access-Jwt-Assertion` to a trusted origin and strips it from an untrusted one. Marking an ungated origin `trusted` forwards a client-forged identity.

`servingLocation` is optional, defaulting to `path-prefix` (route by `mountPath`). Set it to `subdomain` with a DNS-label `subdomainLabel` to route the app by its own `<label>.<zone>` hostname and cookie jar.

## Add an app

Prefer the generator; hand-editing is the fallback.

### Via the generator (the human entry point)

Run the turbo `add-app` generator (`turbo/generators/config.ts`). It prompts for id (kebab-case), mountPath (slash-bounded), navigationLabel, description, the cross-section-navigation flag, status, access model, and origin kind with its variant fields (`turbo/generators/add-app/prompts.ts`). It builds a schema-valid entry, appends it to the registry, and for an `in-repo-cloud-run` origin scaffolds `apps/<id>` from `turbo/generators/templates/in-repo-app`. The prompt restricts origin choices by access model, so it cannot author the bucket-bypasses-auth violation.

The generator derives in-repo origin fields from the id by the naming convention in `app-registry-entry-builder.ts`: `cloudRunServiceName = lucaszanoni-<id>`, `appPackageName = @platform/<id>`, `appDirectoryName = <id>`, with empty env maps. This convention is the contract the directory-consistency check and the deploy matrix depend on; do not deviate when hand-editing.

### By hand

Append one object with all required entry fields and exactly the fields the chosen `origin`/`accessModel` variant requires, no extras (unknown keys are a hard failure at every level). Match the file's 2-space indent and trailing newline (`app-registry-document-writer.ts` is the canonical formatter). Then:

1. **Pick the origin kind and supply its required fields** per the schema/parser. For `in-repo-cloud-run`, follow the id-derived naming convention exactly and create `apps/<appDirectoryName>/package.json` with `name === appPackageName`. Wire its seed container image into `in_repo_app_container_images` in `infra/environments/production/main.tf` and add the matching seed-image variable. For `external-https` / `static-gcs-bucket`, do **not** create an `apps/` directory under that id.
2. **Pick the access model.** If the origin is `static-gcs-bucket`, the access model must be `public`.
3. **Check whole-array uniqueness:** `id` and `mountPath` are globally unique; `cloudRunServiceName` and `appDirectoryName` are unique among in-repo entries; a `subdomain` serving location's `subdomainLabel` is unique. Enforced by `parseAppRegistry` (`app-registry-parser.ts:173-190`).
4. **Do not touch the Worker or add a route, DNS record, or allowed-status list by hand.** The production projection locals derive the matching routing-table list, DNS record, and Worker route from the new entry and re-render `EDGE_ROUTES` on apply.
5. **Validate locally** through both gates: the Ajv schema test and `parseAppRegistry`. Run the config package vitest suite and the deploy `node --test` suites. Mirror the new live registry into the test fixtures (`packages/config/tests/app-registry-test-fixtures.ts`); `app-registry.spec.ts` asserts `appRegistry` deep-equals the fixtures list, so a registry change that skips the fixture update fails CI.

### Adding a new origin kind or access-model kind (not just a new app)

Extend all lockstep surfaces together: the `AppOrigin`/`AppAccessModel` union (`app-registry-types.ts`), the schema `oneOf`, the parser switch and its `requireOneOf` allow-lists, and the builder/answers-resolver/prompts. The dual-enforcement design exists to catch divergence between these.

## Gate an app with Cloudflare Access + Google SSO

Gating is data-driven; no module edit is needed.

1. Set the registry `accessModel.kind` to `owner-only` or `shared` (with a non-empty `audienceKey`). Production projects non-public apps into `local.non_public_apps` and the access module creates one Access application (domain = serving zone + the app's `mountPath`, trailing slash trimmed) and one allow policy.
2. **Owner-only** resolves the allowlist to the single owner email; **shared** resolves to the email list of its `audienceKey` looked up in `shared_access_audience_email_allowlists`. Each policy has a precondition that the resolved allowlist is non-empty, so a missing owner email or an empty audience list fails at plan rather than provisioning an open Access app.
3. For a shared app, add the `audienceKey -> email-list` entry to the `SHARED_ACCESS_AUDIENCE_EMAIL_ALLOWLISTS` CI secret (a JSON map) before relying on it.
4. **Google SSO is wired in once for every managed Access application** via `allowed_idps` + `auto_redirect_to_identity`; you do not re-run SSO setup per app. It is count-gated on both `GOOGLE_SSO_CLIENT_ID` and `GOOGLE_SSO_CLIENT_SECRET` being non-empty (`infra/modules/cloudflare-access/main.tf`); the `google_sso_login_enabled` output is the live signal. See `GOOGLE-SSO-ENABLEMENT.md` for the wiring contract (team subdomain, token scope, secret names).

`trusted` is the sharp edge here: see the rule in "Origin kinds and access models" before marking any `external-https` or subdomain origin trusted.

## CI: path filters, plan-vs-apply, and infra-before-apps

Two workflows split by concern, with disjoint primary path triggers (`infra/**` vs `apps/**`). The registry file is wired into **both**.

- **`deploy-infrastructure.yml`** runs Terraform against `infra/environments/production`. Triggers on `pull_request` _and_ `push` to main (plus `workflow_dispatch`), with identical path filters: `infra/**`, `packages/config/src/app-registry.json`, and its own workflow file. `terraform plan` runs on every event; `terraform apply` is guarded by `if: github.event_name == 'push' || github.event_name == 'workflow_dispatch'`. A PR is plan-only and never mutates production. Production Terraform serializes via a single concurrency group.
- **`deploy-apps.yml`** builds container images and rolls Cloud Run. Triggers on `push` to main only (plus `workflow_dispatch`), no `pull_request` trigger, so app rollout never runs on PRs. Push path filter: `apps/**`, `packages/**`, `deploy/**`, the lockfile/workspace/turbo files, and its own workflow file. The matrix is the registry filtered to `in-repo-cloud-run` rows (`deploy-matrix-from-registry.jq`); an empty matrix hard-fails (exit 1) so the job never passes green having deployed nothing. `buildProfile` selects the Dockerfile (`static-spa` → `deploy/docker/Dockerfile`, `dynamic-service` → `deploy/docker/dynamic-service.Dockerfile`); any other value fails. Rollout is health-gated: a `candidate-<sha>` revision is tagged, image pushed, then traffic migrates after the health check. The matrix is `fail-fast: false` with a per-service concurrency group, so one app's failure does not abort the others.
- **`ci.yml`** (separate) runs typecheck/lint/test/build plus the node test suites, including the registry/app-directory consistency test. That test flags `missing-app-directory`, `package-name-mismatch`, `orphan-app-directory`, and an unexpected directory for a non-in-repo entry (`deploy/registry-app-directory-consistency.mjs`). It guards the 1:1 mapping between every in-repo entry and a real app package.

A registry edit forces a full deploy: `app-registry.json` is in the change-scoped-deploy global-input set (`deploy/deploy-matrix/scope-deploy-matrix-to-changed-apps.mjs`), so even with change-scoping on, editing the registry deploys every app rather than the changed subset.

### Infra-before-apps sequencing

Both workflows trigger on the same registry commit but run independently with no cross-workflow dependency. The app rollout's health-gated traffic migration assumes the Terraform-managed Cloud Run service, edge route, and IAM already exist. So let `deploy-infrastructure` apply first (or confirm the route/service/IAM exists) before relying on the app rollout. The safe path: open a PR, review the `terraform plan` to confirm the new service/route resources appear and `ci.yml` is green, then merge to main where apply runs.

Touching only `apps/**` (not the registry) fires `deploy-apps` but **not** `deploy-infrastructure`, so a new service would build with no edge route or IAM provisioned.

## Invariants (never weaken these)

Terse checklist; see the sections above for the mechanics.

- **Registry is the only source of truth.** Never hardcode an app, route, mount path, origin host, DNS record, or allowed-status list where a registry projection belongs. Never fork app metadata into a second list a workflow reads.
- **Schema and parser are one contract.** Any union or field change lands in both, plus the parser's `requireOneOf` allow-lists. Both reject unknown properties at every level.
- **Closed unions stay closed.** `origin.kind` ∈ {`in-repo-cloud-run`, `external-https`, `static-gcs-bucket`}; `accessModel.kind` ∈ {`public`, `owner-only`, `shared`}. Each variant carries exactly its own fields.
- **`static-gcs-bucket` ⇒ `public`**, and **`trusted` only for an Access-gated route** that overwrites client assertions. (See the cross-field rules above.)
- **Uniqueness:** `id`, `mountPath` globally; `cloudRunServiceName`, `appDirectoryName` among in-repo entries; `subdomainLabel` among subdomain serving locations.
- **The in-repo naming convention** (`cloudRunServiceName=lucaszanoni-<id>`, `appPackageName=@platform/<id>`, `appDirectoryName=<id>`) is load-bearing for the deploy matrix and consistency check.
- **Every in-repo entry maps 1:1 to a real app package** (directory + `package.json name`); no orphaned `apps/` directory; no non-in-repo entry secretly owns one. The consistency gate must return empty.
- **Public nav requires public access.** `CROSS_SECTION_NAVIGATION_ROUTES` includes an entry only when `showInCrossSectionNavigation` is true _and_ the access model is `public`.
- **Only `in-repo-cloud-run` entries are built/rolled** by `deploy-apps`; edge-only origins are attached at the edge, never turned into build targets.
- **One edge Worker, data-only.** Never introduce a per-app Worker; never branch on a specific app inside the Worker. The Worker's branch order is fixed and load-bearing: aliasRedirect → subdomain (by hostname) → retired (410) → static bucket → external-https → Cloud Run prefix with shell fallback. Reordering changes which origin a path resolves to.
- **The shared-secret boundary.** Only `in-repo-cloud-run` origins receive the `EDGE_SHARED_SECRET` header; external and bucket origins never do; Cloud Run rejects any request lacking it.
- **Scale-to-zero stays.** `min_instance_count` stays 0; never raise min instances as a substitute for warmth, and never grant non-`allUsers` IAM as the access mechanism.
- **Production apply only on push-to-main or `workflow_dispatch`**, never on `pull_request`. Do not weaken the apply if-guard.
- **CD stays keyless** via WIF; never reintroduce a stored service-account key.
- **Secrets stay out of the repo.** Secret material flows only through Secret Manager (`secretEnvironmentReferences`) or CI-injected `TF_VAR_*` from GitHub secrets (`CLOUDFLARE_API_TOKEN`, `EDGE_SHARED_SECRET_VALUE`, `CLOUDFLARE_ACCOUNT_ID`, `OWNER_ACCOUNT_EMAIL`, `SHARED_ACCESS_AUDIENCE_EMAIL_ALLOWLISTS`, `GOOGLE_SSO_CLIENT_ID/SECRET`). `nonSecretEnvironment` is for non-secret values only. Account ids, owner email, audience emails, OAuth credentials, and the edge shared secret are never committed.
- **The sensitive auth inputs** (`owner_account_email`, `shared_access_audience_email_allowlists`, `google_sso_client_id`, `google_sso_client_secret`) stay sensitive with empty defaults; an empty owner email or audience list fails the Access policy precondition at plan, never provisions an open app.

## Owner-only actions (a maintainer cannot self-serve)

The agent's keyless CI applies only the `production` Terraform state. These require an owner with broader scope:

- **GCP foundation state** (Artifact Registry repository, billing). The image-retention cleanup policy and the GCP budget alert live there, not in `production`. See `infra/COST-CEILINGS.md`, which owns the exact policy and rationale.
- **Setting/rotating CI secrets and Variables** (the `TF_VAR_`-fed secrets above, and the `ENABLE_*` repo Variables that gate edge, dotcom-canonical, reports static routes, change-scoped deploy, and the worker rollout smoke gate).
- **Cloudflare Zero Trust account state and the CD token scope.** The token must carry `Access: Apps and Policies: Edit`. See `GOOGLE-SSO-ENABLEMENT.md`.
- **The Cloudflare team subdomain and the Google OAuth client.** The team name is baked into the OAuth redirect URI and is semi-permanent once chosen.
- **Moving the edge Worker to a paid Cloudflare plan** if sustained traffic approaches the platform-wide request ceiling. See `infra/COST-CEILINGS.md`.
