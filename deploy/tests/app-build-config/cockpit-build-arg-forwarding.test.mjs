import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { appRegistry } from "../../../packages/config/src/app-registry.ts";
import { createApplicationBuildEnvironment } from "../../cloudflare/application-deployment.mjs";
import {
  cockpitForwardedBuildArgSpecs,
  findUnforwardedCockpitBuildArgs,
} from "../../cockpit-build-config/cockpit-build-arg-forwarding.mjs";

const workflow = readFileSync(
  new URL("../../../.github/workflows/ci.yml", import.meta.url),
  "utf8",
);

test("Cockpit forwards machine endpoints from GitHub secrets into the native static build", () => {
  const source = appRegistry.find(
    (application) => application.id === "cockpit",
  ).source;
  assert.match(
    workflow,
    /COCKPIT_WORKSPACE_MACHINES: \$\{\{ secrets\.COCKPIT_WORKSPACE_MACHINES \}\}/,
  );
  assert.equal(
    createApplicationBuildEnvironment(source, {
      COCKPIT_WORKSPACE_MACHINES: "machines",
    }).VITE_COCKPIT_WORKSPACE_MACHINES,
    "machines",
  );
});

test("flags a build arg that is never forwarded by the workflow", () => {
  const dockerfile = [
    "FROM node AS build",
    "ARG VITE_COCKPIT_WORKSPACE_MACHINES",
    "ENV VITE_COCKPIT_WORKSPACE_MACHINES=${VITE_COCKPIT_WORKSPACE_MACHINES}",
    "RUN pnpm build",
  ].join("\n");
  assert.deepEqual(
    findUnforwardedCockpitBuildArgs(dockerfile, "docker build .", [
      {
        buildArg: "VITE_COCKPIT_WORKSPACE_MACHINES",
        secretName: "COCKPIT_WORKSPACE_MACHINES",
      },
    ]),
    [
      {
        buildArg: "VITE_COCKPIT_WORKSPACE_MACHINES",
        gaps: ["missing-build-arg-forwarding", "missing-secret-binding"],
      },
    ],
  );
});

test("flags an env export placed after the production build so vite never sees it", () => {
  const dockerfile = [
    "FROM node AS build",
    "ARG VITE_COCKPIT_WORKSPACE_MACHINES",
    "RUN pnpm build",
    "ENV VITE_COCKPIT_WORKSPACE_MACHINES=${VITE_COCKPIT_WORKSPACE_MACHINES}",
  ].join("\n");
  const workflow = [
    '--build-arg VITE_COCKPIT_WORKSPACE_MACHINES="${COCKPIT_WORKSPACE_MACHINES:-}"',
  ].join("\n");
  assert.deepEqual(
    findUnforwardedCockpitBuildArgs(dockerfile, workflow, [
      {
        buildArg: "VITE_COCKPIT_WORKSPACE_MACHINES",
        secretName: "COCKPIT_WORKSPACE_MACHINES",
      },
    ]),
    [
      {
        buildArg: "VITE_COCKPIT_WORKSPACE_MACHINES",
        gaps: ["env-export-after-build"],
      },
    ],
  );
});

test("accepts a fully wired build arg with no gaps", () => {
  const dockerfile = [
    "FROM node AS build",
    "ARG VITE_COCKPIT_WORKSPACE_MACHINES",
    "ENV VITE_COCKPIT_WORKSPACE_MACHINES=${VITE_COCKPIT_WORKSPACE_MACHINES}",
    "RUN pnpm --filter app build",
  ].join("\n");
  const workflow = [
    '--build-arg VITE_COCKPIT_WORKSPACE_MACHINES="${COCKPIT_WORKSPACE_MACHINES:-}"',
  ].join("\n");
  assert.deepEqual(
    findUnforwardedCockpitBuildArgs(dockerfile, workflow, [
      {
        buildArg: "VITE_COCKPIT_WORKSPACE_MACHINES",
        secretName: "COCKPIT_WORKSPACE_MACHINES",
      },
    ]),
    [],
  );
});

test("guards only the machine endpoints as forwarded secret build args", () => {
  assert.deepEqual(
    cockpitForwardedBuildArgSpecs.map((spec) => spec.buildArg),
    ["VITE_COCKPIT_WORKSPACE_MACHINES"],
  );
});

test("Cockpit builds its GitHub review source from the public repository URL without any secret", () => {
  const source = appRegistry.find(
    (application) => application.id === "cockpit",
  ).source;
  assert.equal(
    source.publicBuildEnvironment.VITE_COCKPIT_REPOSITORY_URL,
    "https://github.com/Castrozan/lucaszanoni-web",
  );
  assert.equal(source.publicBuildEnvironment.VITE_COCKPIT_REAL_COMPUTE, "true");
  assert.deepEqual(source.publicBuildEnvironmentReferences, {
    VITE_COCKPIT_WORKSPACE_MACHINES: "COCKPIT_WORKSPACE_MACHINES",
  });
  assert.equal(
    createApplicationBuildEnvironment(source, {}).VITE_COCKPIT_REPOSITORY_URL,
    "https://github.com/Castrozan/lucaszanoni-web",
  );
});

test("no retired GitLab build variable remains in the Dockerfile or the Cockpit registry entry", () => {
  const dockerfile = readFileSync(
    new URL("../../docker/Dockerfile", import.meta.url),
    "utf8",
  );
  const source = appRegistry.find(
    (application) => application.id === "cockpit",
  ).source;
  assert.doesNotMatch(dockerfile, /GITLAB/);
  assert.doesNotMatch(JSON.stringify(source), /GITLAB/);
});
