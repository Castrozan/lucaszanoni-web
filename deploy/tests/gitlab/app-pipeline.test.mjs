import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { generateAppPipeline } from "../../gitlab/generate-app-pipeline.mjs";

test("every deployable registry application reaches its own Cloud Run job", () => {
  const matrix = JSON.parse(
    execFileSync(
      "jq",
      [
        "-c",
        "-f",
        "deploy/deploy-matrix-from-registry.jq",
        "packages/config/src/app-registry.json",
      ],
      { encoding: "utf8" },
    ),
  );
  const pipeline = generateAppPipeline(matrix);
  const jobs = Object.entries(pipeline).filter(([name]) =>
    name.startsWith("deploy:"),
  );
  assert.equal(jobs.length, matrix.include.length);
  for (const application of matrix.include) {
    const job = pipeline[`deploy:${application.app_directory_name}`];
    assert.equal(job.extends, ".deploy-app");
    assert.equal(
      job.variables.CLOUD_RUN_SERVICE_NAME,
      application.service_name,
    );
    assert.equal(job.variables.BUILD_PROFILE, application.build_profile);
    assert.equal(job.variables.APP_PACKAGE_NAME, application.app_package_name);
    assert.equal(job.variables.APP_MOUNT_PATH, application.app_mount_path);
  }
});

test("an empty registry cannot silently skip production deployment", () => {
  assert.throws(
    () => generateAppPipeline({ include: [] }),
    /at least one application/,
  );
});
