import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { arrStackApps } from "../../../apps/stack-launcher/src/launcher/arr-stack-apps.ts";
import { appRegistry } from "../../../packages/config/src/app-registry.ts";

const repositoryFile = (path) => new URL(`../../../${path}`, import.meta.url);

const retainedMediaIdentifiers = [
  "jellyfin",
  "jellyseerr",
  "stremio",
  "miwayomi",
  "suwayomi",
  "readmeabook",
  "audiobookshelf",
];
const removedMediaIdentifiers = [
  "kavita",
  "radarr",
  "sonarr",
  "prowlarr",
  "bazarr",
  "qbittorrent",
];

const readTerraformMediaIdentifiers = () => {
  const source = readFileSync(
    repositoryFile("infra/environments/production/arr-stack-media.tf"),
    "utf8",
  );
  const block = source.match(
    /arr_stack_media_hostnames\s*=\s*var\.enable_cloudflare_edge\s*\?\s*\{\n([\s\S]*?)\n\s*\}\s*:\s*\{\}/,
  );
  assert.ok(block, "arr_stack_media_hostnames block is present");
  return [...block[1].matchAll(/^\s*([a-z_]+)\s*=/gm)].map((match) => match[1]);
};

test("Stack catalog and Terraform media hostnames agree on the retained media applications", () => {
  const catalogIdentifiers = arrStackApps.map((application) => application.id);
  const terraformIdentifiers = readTerraformMediaIdentifiers();
  assert.deepEqual(
    [...catalogIdentifiers].sort(),
    [...retainedMediaIdentifiers].sort(),
  );
  assert.deepEqual(
    [...terraformIdentifiers].sort(),
    [...retainedMediaIdentifiers].sort(),
  );
  for (const removed of removedMediaIdentifiers) {
    assert.equal(catalogIdentifiers.includes(removed), false);
    assert.equal(terraformIdentifiers.includes(removed), false);
  }
});

test("Stack stays a private owner-only Cloudflare Worker", () => {
  const stack = appRegistry.find(
    (application) => application.id === "stack-launcher",
  );
  assert.deepEqual(stack.origin, {
    kind: "cloudflare-worker",
    scriptName: "lucaszanoni-stack-launcher",
  });
  assert.deepEqual(stack.accessModel.audience, { kind: "owner" });
});

test("GitLab deployment surfaces stay retired and the GitHub main-push release stays gated", () => {
  for (const retired of [
    ".gitlab-ci.yml",
    ".gitlab",
    "deploy/gitlab",
    "infra/gitlab-identity",
  ]) {
    assert.equal(existsSync(repositoryFile(retired)), false, retired);
  }
  const workflow = readFileSync(
    repositoryFile(".github/workflows/ci.yml"),
    "utf8",
  );
  assert.match(
    workflow,
    /github\.event_name == 'push' && github\.ref == 'refs\/heads\/main'/,
  );
});
