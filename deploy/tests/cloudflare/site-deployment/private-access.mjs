import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import {
  assertPrivateApplicationAccess,
  createSiteDeploymentPlan,
} from "../../../cloudflare/application-deployment.mjs";
import { appRegistry, settings } from "./fixtures.mjs";

test("active production deploys the registry through Cloudflare without GCP authentication or apply", () => {
  const production = readFileSync(
    new URL("../../../../.github/workflows/ci.yml", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(
    production,
    /google-github-actions\/auth|terraform.*apply|gcloud|deploy-app.sh/,
  );
  assert.match(production, /node deploy\/cloudflare\/deploy-site.mjs/);
});

test("private apps require an existing non-bypass Access perimeter before rollout", () => {
  const applications = createSiteDeploymentPlan(
    settings,
    appRegistry,
    "/repository",
  ).applications;
  const gate = {
    domain: "lucaszanoni.com/cockpit",
    type: "self_hosted",
    policies: [{ decision: "allow" }],
  };
  assert.doesNotThrow(() =>
    assertPrivateApplicationAccess(applications, [gate], "lucaszanoni.com"),
  );
  assert.throws(
    () => assertPrivateApplicationAccess(applications, [], "lucaszanoni.com"),
    /requires an existing/,
  );
  assert.throws(
    () =>
      assertPrivateApplicationAccess(
        applications,
        [{ ...gate, policies: [{ decision: "bypass" }] }],
        "lucaszanoni.com",
      ),
    /non-bypass/,
  );
  assert.throws(
    () => assertPrivateApplicationAccess(applications, [gate], undefined),
    /CLOUDFLARE_SITE_HOSTNAME/,
  );
});

test("private routing preserves deliberate public child exceptions but cannot inherit a bypass", () => {
  const application = createSiteDeploymentPlan(
    settings,
    appRegistry,
    "/repository",
  ).applications[0];
  const allow = {
    domain: "lucaszanoni.com/cockpit",
    type: "self_hosted",
    policies: [{ decision: "allow" }],
  };
  const bypass = {
    domain: "lucaszanoni.com/cockpit/local-cockpit.py",
    type: "self_hosted",
    policies: [{ decision: "bypass" }],
  };
  assert.doesNotThrow(() =>
    assertPrivateApplicationAccess(
      [application],
      [allow, bypass],
      "lucaszanoni.com",
    ),
  );
  const inherited = {
    ...application,
    mountPath: "/cockpit/local-cockpit.py/private/",
    accessApplicationProvisioning: {
      kind: "inherited-from-parent-path",
      parentMountPath: "/cockpit/",
    },
  };
  assert.throws(
    () =>
      assertPrivateApplicationAccess(
        [inherited],
        [allow, bypass],
        "lucaszanoni.com",
      ),
    /inherit an Access bypass/,
  );
});
