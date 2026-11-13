import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export function createApplicationAssetManifest(directory) {
  return Object.fromEntries(
    readdirSync(directory, { recursive: true })
      .sort()
      .filter((path) => statSync(join(directory, path)).isFile())
      .map((path) => [
        path,
        createHash("sha256")
          .update(readFileSync(join(directory, path)))
          .digest("hex"),
      ]),
  );
}

export function createApplicationBuildManifest(application) {
  const { configuration } = application;
  return {
    applicationId: application.applicationId,
    workerSha256: createHash("sha256")
      .update(readFileSync(configuration.main))
      .digest("hex"),
    ...(configuration.assets
      ? {
          assetHashes: createApplicationAssetManifest(
            configuration.assets.directory,
          ),
        }
      : {}),
  };
}
