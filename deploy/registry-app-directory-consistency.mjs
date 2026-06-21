export function findRegistryAppDirectoryInconsistencies(
  registryEntries,
  appDirectoryInventory,
) {
  const inconsistencies = [];
  const packageNameByDirectoryName = new Map(
    appDirectoryInventory.map((item) => [item.directoryName, item.packageName]),
  );
  const inRepoAppDirectoryNames = new Set(
    registryEntries
      .filter((entry) => entry.origin.kind === "in-repo-cloud-run")
      .map((entry) => entry.origin.appDirectoryName),
  );

  for (const entry of registryEntries) {
    if (entry.origin.kind !== "in-repo-cloud-run") {
      if (
        packageNameByDirectoryName.has(entry.id) &&
        !inRepoAppDirectoryNames.has(entry.id)
      ) {
        inconsistencies.push({
          kind: "unexpected-app-directory-for-non-in-repo-entry",
          entryId: entry.id,
          originKind: entry.origin.kind,
          directoryName: entry.id,
        });
      }
      continue;
    }
    const expectedAppDirectoryName = entry.origin.appDirectoryName;
    const actualPackageName = packageNameByDirectoryName.get(
      expectedAppDirectoryName,
    );
    if (actualPackageName === undefined) {
      inconsistencies.push({
        kind: "missing-app-directory",
        entryId: entry.id,
        expectedAppDirectoryName,
      });
      continue;
    }
    if (actualPackageName !== entry.origin.appPackageName) {
      inconsistencies.push({
        kind: "package-name-mismatch",
        entryId: entry.id,
        appDirectoryName: expectedAppDirectoryName,
        expectedPackageName: entry.origin.appPackageName,
        actualPackageName,
      });
    }
  }

  for (const item of appDirectoryInventory) {
    if (!inRepoAppDirectoryNames.has(item.directoryName)) {
      inconsistencies.push({
        kind: "orphan-app-directory",
        directoryName: item.directoryName,
      });
    }
  }

  return inconsistencies;
}
