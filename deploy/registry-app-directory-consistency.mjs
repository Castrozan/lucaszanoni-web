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
      .filter((entry) => entry.source)
      .map((entry) => entry.source.appDirectoryName),
  );

  for (const entry of registryEntries) {
    if (!entry.source) {
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
    const expectedAppDirectoryName = entry.source.appDirectoryName;
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
    if (actualPackageName !== entry.source.appPackageName) {
      inconsistencies.push({
        kind: "package-name-mismatch",
        entryId: entry.id,
        appDirectoryName: expectedAppDirectoryName,
        expectedPackageName: entry.source.appPackageName,
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
