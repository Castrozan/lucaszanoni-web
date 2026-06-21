import { scopeDeployMatrixToChangedApps } from "./scope-deploy-matrix-to-changed-apps.mjs";

function parseChangedFilePaths(rawChangedFilePaths) {
  if (typeof rawChangedFilePaths !== "string") {
    return [];
  }
  return rawChangedFilePaths
    .split(/\r?\n/)
    .map((changedFilePath) => changedFilePath.trim())
    .filter((changedFilePath) => changedFilePath.length > 0);
}

const fullDeployMatrix = JSON.parse(process.env.FULL_DEPLOY_MATRIX ?? "");
const affectedAppPackageNames = JSON.parse(
  process.env.AFFECTED_APP_PACKAGE_NAMES || "[]",
);
const changedFilePaths = parseChangedFilePaths(process.env.CHANGED_FILE_PATHS);

const scopedDeployMatrix = scopeDeployMatrixToChangedApps({
  fullMatrixInclude: fullDeployMatrix.include,
  affectedAppPackageNames,
  changedFilePaths,
});

process.stdout.write(JSON.stringify(scopedDeployMatrix));
