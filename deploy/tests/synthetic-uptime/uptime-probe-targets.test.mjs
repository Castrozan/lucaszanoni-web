import test from "node:test";
import assert from "node:assert/strict";
import {
  deriveUptimeProbeTargets,
  isObservedStatusHealthy,
} from "../../synthetic-uptime/uptime-probe-targets.mjs";

function publicEntry(id, mountPath, healthProbePath) {
  return {
    id,
    mountPath,
    status: "active",
    accessModel: { kind: "public" },
    origin: {
      kind: "in-repo-cloud-run",
      cloudRunServiceName: `lucaszanoni-${id}`,
    },
    ...(healthProbePath === undefined ? {} : { healthProbePath }),
  };
}

function ownerOnlyEntry(id, mountPath, healthProbePath) {
  return {
    id,
    mountPath,
    status: "active",
    accessModel: { kind: "owner-only" },
    origin: { kind: "external-https", originHost: "private-app.example.test" },
    ...(healthProbePath === undefined ? {} : { healthProbePath }),
  };
}

function retiredEntry(id, mountPath) {
  return {
    id,
    mountPath,
    status: "retired",
    accessModel: { kind: "public" },
    origin: {
      kind: "in-repo-cloud-run",
      cloudRunServiceName: `lucaszanoni-${id}`,
    },
  };
}

test("derives a root-mount public target probing the mount itself when no healthProbePath is set", () => {
  assert.deepEqual(deriveUptimeProbeTargets([publicEntry("shell", "/")]), [
    { id: "shell", mountPath: "/", probePath: "/", healthyStatuses: [200] },
  ]);
});

test("appends the healthProbePath to the mount prefix without doubling slashes", () => {
  assert.deepEqual(
    deriveUptimeProbeTargets([
      publicEntry("reports", "/engineering/dotfiles/reports/", "/health"),
    ]),
    [
      {
        id: "reports",
        mountPath: "/engineering/dotfiles/reports/",
        probePath: "/engineering/dotfiles/reports/health",
        healthyStatuses: [200],
      },
    ],
  );
});

test("classifies a gated app as healthy on an Access interception status", () => {
  assert.deepEqual(
    deriveUptimeProbeTargets([ownerOnlyEntry("admin", "/admin/", "/health")]),
    [
      {
        id: "admin",
        mountPath: "/admin/",
        probePath: "/admin/health",
        healthyStatuses: [302, 401],
      },
    ],
  );
});

test("excludes retired entries from the probe set", () => {
  assert.deepEqual(
    deriveUptimeProbeTargets([
      publicEntry("shell", "/"),
      retiredEntry("legacy", "/legacy/"),
    ]),
    [{ id: "shell", mountPath: "/", probePath: "/", healthyStatuses: [200] }],
  );
});

test("treats a missing status as active so a legacy entry without status is still probed", () => {
  const entryWithoutStatus = {
    id: "shell",
    mountPath: "/",
    accessModel: { kind: "public" },
    origin: {
      kind: "in-repo-cloud-run",
      cloudRunServiceName: "lucaszanoni-shell",
    },
  };
  assert.deepEqual(deriveUptimeProbeTargets([entryWithoutStatus]), [
    { id: "shell", mountPath: "/", probePath: "/", healthyStatuses: [200] },
  ]);
});

test("accepts an observed status inside the healthy set and rejects one outside it", () => {
  assert.equal(isObservedStatusHealthy(200, [200]), true);
  assert.equal(isObservedStatusHealthy(302, [302, 401]), true);
  assert.equal(isObservedStatusHealthy(500, [200]), false);
  assert.equal(isObservedStatusHealthy(0, [200]), false);
});
