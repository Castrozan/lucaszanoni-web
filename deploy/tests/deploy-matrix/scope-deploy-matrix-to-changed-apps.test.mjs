import test from "node:test";
import assert from "node:assert/strict";
import {
  changedPathsForceFullDeploy,
  scopeDeployMatrixToChangedApps,
} from "../../deploy-matrix/scope-deploy-matrix-to-changed-apps.mjs";

const fullMatrixInclude = [
  {
    service_name: "lucaszanoni-shell",
    app_package_name: "@platform/shell",
    app_directory_name: "shell",
    app_mount_path: "/",
    build_profile: "static-spa",
  },
  {
    service_name: "lucaszanoni-usage-dashboard",
    app_package_name: "@platform/usage-dashboard",
    app_directory_name: "usage-dashboard",
    app_mount_path: "/engineering/dotfiles/claude/usage/",
    build_profile: "static-spa",
  },
  {
    service_name: "lucaszanoni-reports",
    app_package_name: "@platform/reports",
    app_directory_name: "reports",
    app_mount_path: "/engineering/dotfiles/reports/",
    build_profile: "static-spa",
  },
];

function scopedPackageNames(scopedMatrix) {
  return scopedMatrix.include.map((row) => row.app_package_name);
}

test("scopes the matrix to a single app when only that app's source changed", () => {
  const scoped = scopeDeployMatrixToChangedApps({
    fullMatrixInclude,
    affectedAppPackageNames: ["@platform/shell"],
    changedFilePaths: ["apps/shell/src/App.tsx"],
  });
  assert.deepEqual(scopedPackageNames(scoped), ["@platform/shell"]);
});

test("scopes to exactly the dependent apps turbo reports affected by a shared-package edit", () => {
  const scoped = scopeDeployMatrixToChangedApps({
    fullMatrixInclude,
    affectedAppPackageNames: [
      "@platform/design-system",
      "@platform/shell",
      "@platform/reports",
    ],
    changedFilePaths: ["packages/design-system/src/Button.tsx"],
  });
  assert.deepEqual(scopedPackageNames(scoped), [
    "@platform/shell",
    "@platform/reports",
  ]);
});

test("forces the full matrix when a shared Dockerfile changed even with no affected app packages", () => {
  const scoped = scopeDeployMatrixToChangedApps({
    fullMatrixInclude,
    affectedAppPackageNames: [],
    changedFilePaths: ["deploy/docker/Dockerfile"],
  });
  assert.deepEqual(scoped.include, fullMatrixInclude);
});

test("forces the full matrix when the registry itself changed", () => {
  const scoped = scopeDeployMatrixToChangedApps({
    fullMatrixInclude,
    affectedAppPackageNames: ["@platform/shell"],
    changedFilePaths: ["packages/config/src/app-registry.json"],
  });
  assert.deepEqual(scoped.include, fullMatrixInclude);
});

test("forces the full matrix when the lockfile, workspace, turbo config, or deploy workflow changed", () => {
  for (const globalPath of [
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "turbo.json",
    "package.json",
    "deploy/cloud-run/roll-service-onto-image-with-health-gated-traffic-migration.sh",
    "deploy/deploy-matrix-from-registry.jq",
    ".github/workflows/deploy-apps.yml",
  ]) {
    const scoped = scopeDeployMatrixToChangedApps({
      fullMatrixInclude,
      affectedAppPackageNames: [],
      changedFilePaths: [globalPath],
    });
    assert.deepEqual(
      scoped.include,
      fullMatrixInclude,
      `${globalPath} must force a full deploy`,
    );
  }
});

test("forces the full matrix when the changed-path set is unknown (manual dispatch or missing base ref)", () => {
  const scoped = scopeDeployMatrixToChangedApps({
    fullMatrixInclude,
    affectedAppPackageNames: [],
    changedFilePaths: null,
  });
  assert.deepEqual(scoped.include, fullMatrixInclude);
});

test("yields an empty matrix when a non-global change affects no app package", () => {
  const scoped = scopeDeployMatrixToChangedApps({
    fullMatrixInclude,
    affectedAppPackageNames: [],
    changedFilePaths: ["deploy/tests/edge-router/edge-router-worker.test.mjs"],
  });
  assert.deepEqual(scoped.include, []);
});

test("the force-full predicate treats only shared global inputs as global, not app or package source", () => {
  assert.equal(changedPathsForceFullDeploy(["apps/shell/src/App.tsx"]), false);
  assert.equal(
    changedPathsForceFullDeploy(["packages/design-system/src/Button.tsx"]),
    false,
  );
  assert.equal(changedPathsForceFullDeploy(["apps/shell/package.json"]), false);
  assert.equal(changedPathsForceFullDeploy(["turbo.json"]), true);
  assert.equal(changedPathsForceFullDeploy(["deploy/docker/Dockerfile"]), true);
  assert.equal(changedPathsForceFullDeploy(null), true);
  assert.equal(changedPathsForceFullDeploy([]), true);
});
