import { describe, expect, it } from "vitest";
import { appendEntryToRegistryDocument } from "./app-registry-document-writer";
import { buildAppRegistryEntry } from "./app-registry-entry-builder";
import { parseAppRegistry } from "./app-registry-parser";
import { AppRegistryValidationError } from "./app-registry-types";
import type { AppRegistryEntry } from "./app-registry-types";

const existingEntry = buildAppRegistryEntry({
  id: "ledger",
  mountPath: "/finance/ledger/",
  navigationLabel: "Ledger",
  description: "Double-entry ledger service.",
  showInCrossSectionNavigation: true,
  status: "active",
  accessModel: { kind: "public" },
  origin: { kind: "in-repo-cloud-run", buildProfile: "static-spa" },
});

const existingDocument = `${JSON.stringify([existingEntry], null, 2)}\n`;

const appendedEntry = buildAppRegistryEntry({
  id: "downloads",
  mountPath: "/downloads/",
  navigationLabel: "Downloads",
  description: "Static download index.",
  showInCrossSectionNavigation: false,
  status: "active",
  accessModel: { kind: "public" },
  origin: {
    kind: "static-gcs-bucket",
    bucketName: "lucaszanoni-downloads",
    objectKeyPrefix: "",
  },
});

describe("appendEntryToRegistryDocument", () => {
  it("preserves the existing entries and appends the new one in order", () => {
    const nextDocument = appendEntryToRegistryDocument(
      existingDocument,
      appendedEntry,
    );
    const parsed = JSON.parse(nextDocument) as AppRegistryEntry[];
    expect(parsed).toEqual([existingEntry, appendedEntry]);
  });

  it("serializes with two-space indentation", () => {
    const nextDocument = appendEntryToRegistryDocument(
      existingDocument,
      appendedEntry,
    );
    expect(nextDocument).toContain('\n  {\n    "id": "ledger"');
  });

  it("ends with exactly one trailing newline", () => {
    const nextDocument = appendEntryToRegistryDocument(
      existingDocument,
      appendedEntry,
    );
    expect(nextDocument.endsWith("]\n")).toBe(true);
    expect(nextDocument.endsWith("]\n\n")).toBe(false);
  });

  it("produces a document the parser rejects when the appended entry is structurally invalid", () => {
    const sharedEntryMissingAudience = buildAppRegistryEntry({
      id: "downloads",
      mountPath: "/downloads/",
      navigationLabel: "Downloads",
      description: "Static download index.",
      showInCrossSectionNavigation: false,
      status: "active",
      accessModel: { kind: "shared", audienceKey: "" },
      origin: { kind: "in-repo-cloud-run", buildProfile: "static-spa" },
    });
    const nextDocument = appendEntryToRegistryDocument(
      existingDocument,
      sharedEntryMissingAudience,
    );
    const parsed = JSON.parse(nextDocument) as AppRegistryEntry[];
    expect(() => parseAppRegistry(parsed)).toThrow(AppRegistryValidationError);
  });
});
