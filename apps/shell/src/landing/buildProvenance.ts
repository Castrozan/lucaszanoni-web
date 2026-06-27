export interface BuildProvenance {
  readonly shortSha: string | null;
  readonly timestamp: string | null;
  readonly isAvailable: boolean;
}

function nonEmptyOrNull(value: string): string | null {
  return value.length > 0 ? value : null;
}

export function getBuildProvenance(): BuildProvenance {
  const shortSha =
    typeof __ATRIUM_BUILD_SHA__ === "string"
      ? nonEmptyOrNull(__ATRIUM_BUILD_SHA__)
      : null;
  const timestamp =
    typeof __ATRIUM_BUILD_TIME__ === "string"
      ? nonEmptyOrNull(__ATRIUM_BUILD_TIME__)
      : null;
  return { shortSha, timestamp, isAvailable: shortSha !== null };
}

export function formatBuildDate(timestamp: string | null): string | null {
  if (!timestamp) {
    return null;
  }
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString().slice(0, 10);
}
