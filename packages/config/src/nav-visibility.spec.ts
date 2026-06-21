import { describe, expect, it } from "vitest";
import { isPubliclyVisibleNavigationEntry } from "./route-registry";
import { reportsApp, shellApp } from "./app-registry-test-fixtures";
import type { AppRegistryEntry } from "./app-registry-types";

describe("public navigation visibility", () => {
  it("includes a public entry flagged for cross-section navigation", () => {
    expect(isPubliclyVisibleNavigationEntry(reportsApp)).toBe(true);
  });

  it("excludes a public entry not flagged for cross-section navigation", () => {
    expect(isPubliclyVisibleNavigationEntry(shellApp)).toBe(false);
  });

  it("excludes an owner-only entry even when flagged for cross-section navigation", () => {
    const ownerOnlyNavigableEntry: AppRegistryEntry = {
      ...reportsApp,
      id: "owner-only-nav",
      accessModel: { kind: "owner-only" },
    };
    expect(isPubliclyVisibleNavigationEntry(ownerOnlyNavigableEntry)).toBe(
      false,
    );
  });

  it("excludes a shared entry even when flagged for cross-section navigation", () => {
    const sharedNavigableEntry: AppRegistryEntry = {
      ...reportsApp,
      id: "shared-nav",
      accessModel: { kind: "shared", audienceKey: "inner-circle" },
    };
    expect(isPubliclyVisibleNavigationEntry(sharedNavigableEntry)).toBe(false);
  });
});
