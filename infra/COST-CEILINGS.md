# Platform cost ceilings

The platform runs on free and scale-to-zero tiers. This file records every cost ceiling that keeps it there: which ones Terraform already enforces in the agent-applied `production` state, and which ones live in the owner-run GCP foundation state and therefore need an explicit owner action. Keep it current whenever a new origin, service, or budget is added.

## Already enforced (agent-applied `production` state)

- **Cloud Run scale-to-zero.** Every in-repo service sets `min_instance_count = 0` (`infra/modules/serverless-cloud-run-app/main.tf`), so an idle app costs nothing.
- **Cloud Run per-service instance ceiling.** `max_instance_count` defaults to `2` (`infra/modules/serverless-cloud-run-app/variables.tf`), capping the blast radius of a traffic spike or a runaway loop. The `scaling` block is in the service's `lifecycle.ignore_changes`, so this ceiling is set at creation and not re-reconciled on every apply.
- **Cloud Run resource limits.** Each container is pinned to `1` vCPU / `512Mi` with `cpu_idle = true`, so CPU is billed only while a request is in flight.
- **Edge Worker.** A single Cloudflare Worker (`lucaszanoni-edge-router`) fronts every route; there is no per-route Worker, so the request budget below is platform-wide, not per-app.

## Worker request budget (platform-wide hard limit)

The Cloudflare Workers free plan allows **100,000 requests per day**, shared across every invocation of the single edge-router Worker. Because that one Worker handles every route on the platform (alias redirects, retired-route 410s, static-bucket reads, external-https origins, and Cloud Run origins all flow through it), the 100k/day budget is a **platform-wide ceiling**, not a per-app allowance. Every new app mounted behind the edge draws from the same daily pool. When sustained traffic approaches the ceiling, the owner moves the Worker to a paid plan rather than splitting it, so the single-Worker invariant (the most-critical resource stays one untouched script) holds.

## Owner-gated actions (owner-run GCP foundation state)

The Artifact Registry repository and the billing account are provisioned in the owner-run GCP foundation state, not in this `production` state (see `application_image_registry` in `infra/environments/production/outputs.tf`). The agent's keyless CI applies only the `production` state, so the two items below cannot be applied by the agent and are surfaced here for the owner to apply.

### 1. Artifact Registry image retention (keep-N cleanup policy)

`deploy-apps` builds and pushes both a `:<commit-sha>` tag and a `:latest` tag for every app on every deploy (`.github/workflows/deploy-apps.yml`). Nothing prunes old `:<sha>` images, so registry storage grows without bound. Add a keep-most-recent cleanup policy to the repository in the foundation state. The repository name `lucaszanoni-web` is a frozen identifier and must not be renamed; only the `cleanup_policies` blocks below are added.

```hcl
resource "google_artifact_registry_repository" "lucaszanoni_web" {
  repository_id = "lucaszanoni-web"
  location      = "southamerica-east1"
  format        = "DOCKER"

  cleanup_policies {
    id     = "keep-most-recent-versions"
    action = "KEEP"
    most_recent_versions {
      keep_count = 10
    }
  }

  cleanup_policies {
    id     = "delete-untagged-after-7-days"
    action = "DELETE"
    condition {
      tag_state  = "UNTAGGED"
      older_than = "604800s"
    }
  }
}
```

`keep_count = 10` retains the ten newest image versions per package (enough to roll back several deploys) and deletes older ones; the `DELETE` policy reaps untagged layers left behind by retags after a week. Tune `keep_count` to the desired rollback depth.

### 2. GCP budget alert

Arm a billing budget with threshold alerts on the GCP billing account so an unexpected cost (a stuck non-scaling service, an egress spike) pages the owner instead of accumulating silently. This needs the billing-account id and `roles/billing.budgets` (or `Billing Account Administrator`) on whichever identity applies the foundation state; the agent's WIF deployer service account is intentionally not granted billing permissions. Apply `google_billing_budget` with an `amount` and `threshold_rules` in the foundation state, or set it from the GCP console Budgets and alerts page.
