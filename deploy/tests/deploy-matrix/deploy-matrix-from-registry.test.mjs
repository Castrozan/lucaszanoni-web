import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const testFileDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(testFileDirectory, "../../..");
const deployMatrixFilterPath = resolve(
  repositoryRoot,
  "deploy/deploy-matrix-from-registry.jq",
);
const applicationRegistryPath = resolve(
  repositoryRoot,
  "packages/config/src/app-registry.json",
);

const expectedDeployMatrixFromCommittedRegistry = {
  include: [
    {
      service_name: "lucaszanoni-shell",
      app_package_name: "@lucaszanoni-web/shell",
      app_directory_name: "shell",
      app_mount_path: "/",
    },
    {
      service_name: "lucaszanoni-usage-dashboard",
      app_package_name: "@lucaszanoni-web/usage-dashboard",
      app_directory_name: "usage-dashboard",
      app_mount_path: "/engineering/dotfiles/claude/usage/",
    },
    {
      service_name: "lucaszanoni-reports",
      app_package_name: "@lucaszanoni-web/reports",
      app_directory_name: "reports",
      app_mount_path: "/engineering/dotfiles/reports/",
    },
  ],
};

function deriveDeployMatrixFromRegistryFile() {
  const jqStandardOutput = execFileSync(
    "jq",
    ["-c", "-f", deployMatrixFilterPath, applicationRegistryPath],
    { encoding: "utf8" },
  );
  return JSON.parse(jqStandardOutput);
}

function deriveDeployMatrixFromRegistryValue(registryArrayValue) {
  const jqStandardOutput = execFileSync(
    "jq",
    ["-c", "-f", deployMatrixFilterPath],
    { encoding: "utf8", input: JSON.stringify(registryArrayValue) },
  );
  return JSON.parse(jqStandardOutput);
}

test("the deploy matrix jq filter reproduces today's hand-authored rows from the committed registry", () => {
  assert.deepEqual(
    deriveDeployMatrixFromRegistryFile(),
    expectedDeployMatrixFromCommittedRegistry,
  );
});

test("the deploy matrix selects only in-repo-cloud-run origins, matching the Terraform for_each predicate", () => {
  const registryWithMixedOrigins = [
    {
      id: "shell",
      mountPath: "/",
      status: "active",
      origin: {
        kind: "in-repo-cloud-run",
        cloudRunServiceName: "lucaszanoni-shell",
        appPackageName: "@lucaszanoni-web/shell",
        appDirectoryName: "shell",
      },
    },
    {
      id: "private-external-app",
      mountPath: "/private/",
      status: "active",
      origin: {
        kind: "external-https",
        externalOriginUrl: "https://private-app.example",
      },
    },
  ];
  assert.deepEqual(
    deriveDeployMatrixFromRegistryValue(registryWithMixedOrigins),
    {
      include: [
        {
          service_name: "lucaszanoni-shell",
          app_package_name: "@lucaszanoni-web/shell",
          app_directory_name: "shell",
          app_mount_path: "/",
        },
      ],
    },
  );
});
