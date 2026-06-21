import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { findRegistryAppDirectoryInconsistencies } from "../../registry-app-directory-consistency.mjs";

const testFileDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(testFileDirectory, "../../..");
const applicationRegistryPath = resolve(
  repositoryRoot,
  "packages/config/src/app-registry.json",
);
const applicationsDirectory = resolve(repositoryRoot, "apps");

function readApplicationRegistry() {
  return JSON.parse(readFileSync(applicationRegistryPath, "utf8"));
}

function readAppDirectoryInventory() {
  return readdirSync(applicationsDirectory, { withFileTypes: true })
    .filter((directoryEntry) => directoryEntry.isDirectory())
    .map((directoryEntry) => directoryEntry.name)
    .filter((directoryName) =>
      existsSync(join(applicationsDirectory, directoryName, "package.json")),
    )
    .map((directoryName) => ({
      directoryName,
      packageName: JSON.parse(
        readFileSync(
          join(applicationsDirectory, directoryName, "package.json"),
          "utf8",
        ),
      ).name,
    }));
}

function inRepoCloudRunEntry(id, appDirectoryName, appPackageName) {
  return {
    id,
    mountPath: "/",
    status: "active",
    origin: {
      kind: "in-repo-cloud-run",
      cloudRunServiceName: `lucaszanoni-${id}`,
      appPackageName,
      appDirectoryName,
    },
  };
}

function externalHttpsEntry(id) {
  return {
    id,
    mountPath: "/external/",
    status: "active",
    origin: {
      kind: "external-https",
      originHost: "private-app.example.test",
    },
  };
}

test("the committed registry and the apps directories are mutually consistent", () => {
  assert.deepEqual(
    findRegistryAppDirectoryInconsistencies(
      readApplicationRegistry(),
      readAppDirectoryInventory(),
    ),
    [],
  );
});

test("flags an in-repo entry whose app directory is missing", () => {
  assert.deepEqual(
    findRegistryAppDirectoryInconsistencies(
      [inRepoCloudRunEntry("shell", "shell", "@platform/shell")],
      [],
    ),
    [
      {
        kind: "missing-app-directory",
        entryId: "shell",
        expectedAppDirectoryName: "shell",
      },
    ],
  );
});

test("flags an in-repo entry whose app directory package name diverges", () => {
  assert.deepEqual(
    findRegistryAppDirectoryInconsistencies(
      [inRepoCloudRunEntry("shell", "shell", "@platform/shell")],
      [{ directoryName: "shell", packageName: "@platform/renamed" }],
    ),
    [
      {
        kind: "package-name-mismatch",
        entryId: "shell",
        appDirectoryName: "shell",
        expectedPackageName: "@platform/shell",
        actualPackageName: "@platform/renamed",
      },
    ],
  );
});

test("flags an apps directory that no in-repo entry claims", () => {
  assert.deepEqual(
    findRegistryAppDirectoryInconsistencies(
      [inRepoCloudRunEntry("shell", "shell", "@platform/shell")],
      [
        { directoryName: "shell", packageName: "@platform/shell" },
        {
          directoryName: "abandoned",
          packageName: "@platform/abandoned",
        },
      ],
    ),
    [{ kind: "orphan-app-directory", directoryName: "abandoned" }],
  );
});

test("flags a non-in-repo entry that nonetheless owns an apps directory", () => {
  assert.deepEqual(
    findRegistryAppDirectoryInconsistencies(
      [externalHttpsEntry("private-portal")],
      [
        {
          directoryName: "private-portal",
          packageName: "@platform/private-portal",
        },
      ],
    ),
    [
      {
        kind: "unexpected-app-directory-for-non-in-repo-entry",
        entryId: "private-portal",
        originKind: "external-https",
        directoryName: "private-portal",
      },
      { kind: "orphan-app-directory", directoryName: "private-portal" },
    ],
  );
});

test("does not flag a non-in-repo id that collides with an in-repo app directory the in-repo entry owns", () => {
  const inRepo = inRepoCloudRunEntry(
    "reports-app",
    "reports",
    "@platform/reports",
  );
  const external = externalHttpsEntry("reports");
  const inventory = [
    { directoryName: "reports", packageName: "@platform/reports" },
  ];
  assert.deepEqual(
    findRegistryAppDirectoryInconsistencies([inRepo, external], inventory),
    [],
  );
  assert.deepEqual(
    findRegistryAppDirectoryInconsistencies([external, inRepo], inventory),
    [],
  );
});

test("accepts a non-in-repo entry that owns no apps directory", () => {
  assert.deepEqual(
    findRegistryAppDirectoryInconsistencies(
      [
        inRepoCloudRunEntry("shell", "shell", "@platform/shell"),
        externalHttpsEntry("private-portal"),
      ],
      [{ directoryName: "shell", packageName: "@platform/shell" }],
    ),
    [],
  );
});
