const exactGlobalDeployInputPaths = new Set([
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "turbo.json",
  "package.json",
  "deploy/deploy-matrix-from-registry.jq",
  "packages/config/src/app-registry.json",
  ".github/workflows/deploy-apps.yml",
]);

const globalDeployInputPathPrefixes = ["deploy/docker/", "deploy/cloud-run/"];

function isGlobalDeployInputPath(changedFilePath) {
  if (exactGlobalDeployInputPaths.has(changedFilePath)) {
    return true;
  }
  return globalDeployInputPathPrefixes.some((prefix) =>
    changedFilePath.startsWith(prefix),
  );
}

export function changedPathsForceFullDeploy(changedFilePaths) {
  if (!Array.isArray(changedFilePaths) || changedFilePaths.length === 0) {
    return true;
  }
  return changedFilePaths.some(isGlobalDeployInputPath);
}

export function scopeDeployMatrixToChangedApps({
  fullMatrixInclude,
  affectedAppPackageNames,
  changedFilePaths,
}) {
  if (changedPathsForceFullDeploy(changedFilePaths)) {
    return { include: fullMatrixInclude };
  }
  const affectedAppPackageNameSet = new Set(affectedAppPackageNames);
  return {
    include: fullMatrixInclude.filter((deployMatrixRow) =>
      affectedAppPackageNameSet.has(deployMatrixRow.app_package_name),
    ),
  };
}
