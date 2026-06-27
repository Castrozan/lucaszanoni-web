import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  cockpitForwardedBuildArgSpecs,
  findUnforwardedCockpitBuildArgs,
} from "../../cockpit-build-config/cockpit-build-arg-forwarding.mjs";

const testFileDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(testFileDirectory, "../../..");
const staticSpaDockerfileText = readFileSync(
  resolve(repositoryRoot, "deploy/docker/Dockerfile"),
  "utf8",
);
const deployAppsWorkflowText = readFileSync(
  resolve(repositoryRoot, ".github/workflows/deploy-apps.yml"),
  "utf8",
);

test("every cockpit deployment-config build arg is forwarded from a CI secret into the static-spa build", () => {
  assert.deepEqual(
    findUnforwardedCockpitBuildArgs(
      staticSpaDockerfileText,
      deployAppsWorkflowText,
    ),
    [],
  );
});

test("flags a build arg that is never forwarded by the workflow", () => {
  const dockerfile = [
    "FROM node AS build",
    "ARG VITE_COCKPIT_MACHINES",
    "ENV VITE_COCKPIT_MACHINES=${VITE_COCKPIT_MACHINES}",
    "RUN pnpm build",
  ].join("\n");
  assert.deepEqual(
    findUnforwardedCockpitBuildArgs(dockerfile, "docker build .", [
      { buildArg: "VITE_COCKPIT_MACHINES", secretName: "COCKPIT_MACHINES" },
    ]),
    [
      {
        buildArg: "VITE_COCKPIT_MACHINES",
        gaps: ["missing-build-arg-forwarding", "missing-secret-binding"],
      },
    ],
  );
});

test("flags an env export placed after the production build so vite never sees it", () => {
  const dockerfile = [
    "FROM node AS build",
    "ARG VITE_COCKPIT_MACHINES",
    "RUN pnpm build",
    "ENV VITE_COCKPIT_MACHINES=${VITE_COCKPIT_MACHINES}",
  ].join("\n");
  const workflow = [
    '--build-arg VITE_COCKPIT_MACHINES="${COCKPIT_MACHINES}"',
    "secrets.COCKPIT_MACHINES",
  ].join("\n");
  assert.deepEqual(
    findUnforwardedCockpitBuildArgs(dockerfile, workflow, [
      { buildArg: "VITE_COCKPIT_MACHINES", secretName: "COCKPIT_MACHINES" },
    ]),
    [
      {
        buildArg: "VITE_COCKPIT_MACHINES",
        gaps: ["env-export-after-build"],
      },
    ],
  );
});

test("accepts a fully wired build arg with no gaps", () => {
  const dockerfile = [
    "FROM node AS build",
    "ARG VITE_COCKPIT_MACHINES",
    "ENV VITE_COCKPIT_MACHINES=${VITE_COCKPIT_MACHINES}",
    "RUN pnpm --filter app build",
  ].join("\n");
  const workflow = [
    '--build-arg VITE_COCKPIT_MACHINES="${COCKPIT_MACHINES}"',
    "COCKPIT_MACHINES: ${{ secrets.COCKPIT_MACHINES }}",
  ].join("\n");
  assert.deepEqual(
    findUnforwardedCockpitBuildArgs(dockerfile, workflow, [
      { buildArg: "VITE_COCKPIT_MACHINES", secretName: "COCKPIT_MACHINES" },
    ]),
    [],
  );
});

test("guards the GitLab review host and project alongside the machine endpoints", () => {
  assert.deepEqual(
    cockpitForwardedBuildArgSpecs.map((spec) => spec.buildArg),
    [
      "VITE_COCKPIT_GITLAB_BASE_URL",
      "VITE_COCKPIT_GITLAB_PROJECT",
      "VITE_COCKPIT_MACHINES",
    ],
  );
});
