import { describe, expect, it } from "vitest";
import { isPubliclyVisibleNavigationEntry } from "../src/route-registry";
import { reportsApp, shellApp } from "./app-registry-test-fixtures";
import type { AppRegistryEntry } from "../src/app-registry-types";

describe("public navigation visibility", () => {
  it("includes a public entry flagged for cross-section navigation", () => {
    const publicNavigableEntry: AppRegistryEntry = {
      ...reportsApp,
      id: "public-nav",
      accessModel: { environment: "public" },
    };
    expect(isPubliclyVisibleNavigationEntry(publicNavigableEntry)).toBe(true);
  });

  it("excludes a public entry not flagged for cross-section navigation", () => {
    expect(isPubliclyVisibleNavigationEntry(shellApp)).toBe(false);
  });

  it("excludes a private owner entry even when flagged for cross-section navigation", () => {
    const ownerOnlyNavigableEntry: AppRegistryEntry = {
      ...reportsApp,
      id: "owner-only-nav",
      accessModel: { environment: "private", audience: { kind: "owner" } },
    };
    expect(isPubliclyVisibleNavigationEntry(ownerOnlyNavigableEntry)).toBe(
      false,
    );
  });

  it("excludes a private shared entry even when flagged for cross-section navigation", () => {
    const sharedNavigableEntry: AppRegistryEntry = {
      ...reportsApp,
      id: "shared-nav",
      accessModel: {
        environment: "private",
        audience: { kind: "shared", audienceKey: "inner-circle" },
      },
    };
    expect(isPubliclyVisibleNavigationEntry(sharedNavigableEntry)).toBe(false);
  });
});
