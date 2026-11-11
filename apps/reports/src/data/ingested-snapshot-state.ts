export interface IngestedSnapshot<PayloadShape> {
  readonly receivedAt: string;
  readonly producedAt: string;
  readonly payload: PayloadShape;
}

export type SnapshotLoadStatus =
  | "loading"
  | "ready"
  | "missing"
  | "malformed"
  | "unavailable";
export type SnapshotUnloadedState = {
  readonly status: Exclude<SnapshotLoadStatus, "ready">;
};
export type IngestedSnapshotLoadState<PayloadShape> =
  | SnapshotUnloadedState
  | {
      readonly status: "ready";
      readonly snapshot: IngestedSnapshot<PayloadShape>;
    };

export const SNAPSHOT_LOAD_TRANSITIONS = {
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
} as const;

export function transitionSnapshotLoadState<PayloadShape>(
  current: IngestedSnapshotLoadState<PayloadShape>,
  observed: IngestedSnapshotLoadState<PayloadShape>,
): IngestedSnapshotLoadState<PayloadShape> {
  return SNAPSHOT_LOAD_TRANSITIONS[current.status][observed.status]
    ? observed
    : current;
}
