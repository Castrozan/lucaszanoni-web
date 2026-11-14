import { describe, expect, it } from "vitest";
import { appendEntryToRegistryDocument } from "../../src/app-registry/document-writer";
import { buildAppRegistryEntry } from "../../src/app-registry/entry-builder";
import { AppRegistryValidationError } from "../../src/app-registry/types";
import type { AppRegistryEntry } from "../../src/app-registry/types";

const existingEntry = buildAppRegistryEntry({
  id: "ledger",
  mountPath: "/finance/ledger/",
  navigationLabel: "Ledger",
  description: "Double-entry ledger service.",
  showInCrossSectionNavigation: true,
  status: "active",
  accessModel: { environment: "public" },
  source: { buildProfile: "static-spa" },
  origin: { kind: "cloudflare-worker" },
});

const existingDocument = `${JSON.stringify([existingEntry], null, 2)}\n`;

const appendedEntry = buildAppRegistryEntry({
  id: "downloads",
  mountPath: "/downloads/",
  navigationLabel: "Downloads",
  description: "Static download index.",
  showInCrossSectionNavigation: false,
  status: "active",
  accessModel: { environment: "public" },
  origin: {
    kind: "static-gcs-bucket",
    bucketName: "lucaszanoni-downloads",
    objectKeyPrefix: "",
  },
});

describe("appendEntryToRegistryDocument", () => {
  it("validates existing records before serializing the result", () => {
    expect(() =>
      appendEntryToRegistryDocument(
        JSON.stringify([{ ...existingEntry, source: undefined }]),
        appendedEntry,
      ),
    ).toThrow(/requires repository source/);
  });

  it("rejects duplicate records before serializing the result", () => {
    expect(() =>
      appendEntryToRegistryDocument(existingDocument, existingEntry),
    ).toThrow(/duplicate id/);
  });

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

  it("rejects a structurally invalid appended entry before serialization", () => {
    const sharedEntryMissingAudience = buildAppRegistryEntry({
      id: "downloads",
      mountPath: "/downloads/",
      navigationLabel: "Downloads",
      description: "Static download index.",
      showInCrossSectionNavigation: false,
      status: "active",
      accessModel: {
        environment: "private",
        audience: { kind: "shared", audienceKey: "" },
      },
      source: { buildProfile: "static-spa" },
      origin: { kind: "cloudflare-worker" },
    });
    expect(() =>
      appendEntryToRegistryDocument(
        existingDocument,
        sharedEntryMissingAudience,
      ),
    ).toThrow(AppRegistryValidationError);
  });
});
