import { describe, expect, it } from "vitest";
import {
  SNAPSHOT_LOAD_TRANSITIONS,
  transitionSnapshotLoadState,
  type IngestedSnapshotLoadState,
  type SnapshotLoadStatus,
} from "../../src/data/ingested-snapshot-state";

function state(status: SnapshotLoadStatus): IngestedSnapshotLoadState<unknown> {
  return status === "ready"
    ? {
        status,
        snapshot: {
          receivedAt: "2026-11-11T12:00:00Z",
          producedAt: "2026-11-11T12:00:00Z",
          payload: {},
        },
      }
    : { status };
}

describe("snapshot lifecycle", () => {
  it("exhaustively defines every state and observation pair", () => {
    const expected = {
      loading: {
        loading: true,
        ready: true,
        missing: true,
        malformed: true,
        unavailable: true,
      },
      ready: {
        loading: true,
        ready: false,
        missing: false,
        malformed: false,
        unavailable: false,
      },
      missing: {
        loading: true,
        ready: false,
        missing: false,
        malformed: false,
        unavailable: false,
      },
      malformed: {
        loading: true,
        ready: false,
        missing: false,
        malformed: false,
        unavailable: false,
      },
      unavailable: {
        loading: true,
        ready: false,
        missing: false,
        malformed: false,
        unavailable: false,
      },
    };
    expect(SNAPSHOT_LOAD_TRANSITIONS).toEqual(expected);
    const statuses = Object.keys(expected) as SnapshotLoadStatus[];
    for (const currentStatus of statuses) {
      for (const observedStatus of statuses) {
        const current = state(currentStatus);
        const observed = state(observedStatus);
        expect(transitionSnapshotLoadState(current, observed)).toBe(
          expected[currentStatus][observedStatus] ? observed : current,
        );
      }
    }
  });
});
