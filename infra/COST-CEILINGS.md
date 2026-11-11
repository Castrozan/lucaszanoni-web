# Platform cost ceilings

The platform must not incur charges. It runs on free-tier limits, and deployments must keep it there.

## Policy

- Google Cloud billing is disabled. Retained infrastructure code under `infra/` does not authorize applying it, enabling billing, or resuming workloads.
- CI deploys only registry static targets, as private Cloudflare Workers, within the free Cloudflare account limits. The authority for those limits is the [Cloudflare Workers pricing page](https://developers.cloudflare.com/workers/platform/pricing/). Check that page for current figures instead of relying on copies in this repository.
- The architecture is one edge Worker plus app Workers, each reached through its own service binding. Request and invocation limits apply to the account, not to a single Worker.
- A deployment must not activate GCP billing, a paid Cloudflare plan, public paid storage, or any other paid service.
- Preserving Google SSO and personal Google services does not depend on GCP development billing.
- Instance and image limits in the retained Google Cloud source are configuration, not a guarantee of zero charges.

## Changing this policy

Adding a paid service, plan, or billing account requires an explicit owner decision. Record that decision in this file before the change is made.
