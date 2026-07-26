import { describe, expect, it } from "vitest";
import {
  buildLatestSnapshotObjectKey,
  buildSnapshotEventObjectKey,
  SNAPSHOT_OBJECT_KEY_ROOT,
} from "../src/ingestion-snapshot-object-keys";
import { IngestionContractViolationError } from "../src/ingestion-types";

describe("snapshot object keys", () => {
  it("points every consumer at one latest object per topic", () => {
    expect(buildLatestSnapshotObjectKey("dotfiles-test-baseline")).toBe(
      `${SNAPSHOT_OBJECT_KEY_ROOT}/dotfiles-test-baseline/latest.json`,
    );
  });

  it("keeps each received event under a sortable per topic history key", () => {
    expect(
      buildSnapshotEventObjectKey(
        "dotfiles-test-baseline",
        "2026-07-24T03:26:24.774Z",
        "5667c9f6",
      ),
    ).toBe(
      `${SNAPSHOT_OBJECT_KEY_ROOT}/dotfiles-test-baseline/events/2026-07-24T03:26:24.774Z-5667c9f6.json`,
    );
  });

  it("refuses a topic that would escape its own prefix", () => {
    expect(() => buildLatestSnapshotObjectKey("../other-topic")).toThrow(
      IngestionContractViolationError,
    );
  });

  it("refuses an event identifier that would escape its own prefix", () => {
    expect(() =>
      buildSnapshotEventObjectKey(
        "dotfiles-test-baseline",
        "2026-07-24T03:26:24.774Z",
        "../../etc/passwd",
      ),
    ).toThrow(IngestionContractViolationError);
  });

  it("refuses a produced at stamp that is not a timestamp", () => {
    expect(() =>
      buildSnapshotEventObjectKey(
        "dotfiles-test-baseline",
        "whenever",
        "5667c9f6",
      ),
    ).toThrow(IngestionContractViolationError);
  });
});
