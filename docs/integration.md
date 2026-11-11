# Migrating an app to a Cloudflare Worker

How to move an app onto the Cloudflare Worker target, and where the data and runtime migrations stop. This guide owns the workflow only. The authoritative shapes live in code: the registry schema and types under `packages/config/src/app-registry/`, `packages/config/src/app-registry.schema.json`, and the deployer in `deploy/cloudflare/`. When this guide and those files disagree, the files win. For the platform overview see the [README](../README.md).

Background: [Workers static assets](https://developers.cloudflare.com/workers/static-assets/) and [service bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/).

## Steps

1. **Read the registry contract.** Inspect the schema at `packages/config/src/app-registry.schema.json` and the types under `packages/config/src/app-registry/`. An app declares its source, mount, access model and capabilities independently of its target; the target is only the origin. Do not add compatibility aliases for old shapes.

2. **Change only the origin.** For an existing `static-spa` source, set its origin to `{ "kind": "cloudflare-worker", "scriptName": "lucaszanoni-<app-id>" }`. Leave source and build settings, mount and private audience untouched. Static SPAs are the supported build adapter. A dynamic-service or Next.js app, or a Worker on its own subdomain, needs a real runtime adapter first: do not invent a static export and do not silently drop its APIs.

3. **Verify locally.** Run the normal checks, then `node deploy/cloudflare/verify-local-site.mjs`. It builds real public-root and private-nested SPAs and tests them in native workerd: documents, deep links, asset hashes and namespace isolation between apps. It does not simulate an Access login and does not prove production health.

4. **Confirm the Access gate exists.** A private app needs its Cloudflare Access gate to exist already. The deployer refuses a missing or bypass gate, and refuses to take over an existing script it does not own. It never creates or widens Access policies. Keep Google SSO and the public helper exceptions as they are.

5. **Dry-run the deployer.** Run `node deploy/cloudflare/deploy-site.mjs --dry-run` with `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_SITE_HOSTNAME` and either `CLOUDFLARE_ACCOUNT_ID` or the protected `PRODUCTION_TERRAFORM_VARIABLES` file, from which only the account ID is read. Never paste or commit these values. The default-branch job runs the same entry point: it builds the targets, publishes the private app Workers, then the edge service bindings, reads the settings back, and keeps `workers.dev` and preview URLs disabled. A dry run is not deployment evidence.

6. **Migrate data and runtime separately.** Moving a UI does not move its feeds or services.
   - `packages/config/src/snapshot-artifacts.json` owns the artifact-store HTTPS base URL. The snapshot client takes a `snapshotUrl` and a reader; report sources take the base URL and distinguish loading, missing, malformed, unavailable and ready. Keep object keys and producer data real.
   - Ingest already owns a `SnapshotObjectWriter`. Replace its concrete writer where the server is composed, without changing ingestion protocols.
   - `packages/ai-runtime` owns the model factory, and both AI apps consume the AI SDK `LanguageModel` interface. Do not call paid model APIs to test a refactor.

7. **Do not mistake the infra command for a Cloudflare deploy.** `infra/environments/production` also provisions Google Cloud and keeps a GCS backend, so it is not a Cloudflare-only command. Do not activate billing, run a broad Terraform apply, create secrets with `gcloud`, or upgrade a paid plan as part of this migration. Targets that are not Cloudflare Workers remain unchanged.

## What this guide does not establish

Passing these steps shows that a build and its routing contract hold locally and that the deployer accepts the plan. It does not show that any given app is deployed, healthy, or reachable by its audience.
