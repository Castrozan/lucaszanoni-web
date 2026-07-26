import type { SnapshotObjectWriter } from "../src/snapshot-object-writer";

export const testBaselineEventFixture = {
  topic: "dotfiles-test-baseline",
  schemaVersion: 1,
  producedAt: "2026-07-24T03:26:24.774Z",
  producer: "dotfiles-github-actions",
  source: {
    repository: "Castrozan/.dotfiles",
    commit: "5667c9f6",
    runUrl: "https://github.com/Castrozan/.dotfiles/actions/runs/1",
  },
  payload: {
    recordedAt: "2026-07-24T03:26:24.774576+00:00",
    commit: "5667c9f6",
    totalTests: 6,
    passedTests: 5,
    failedTests: 1,
    passRate: 0.8333,
    categories: [
      {
        category: "adversarial",
        passed: 2,
        failed: 0,
        tests: [
          { name: "injection_rewriting_core_rules_is_blocked", passed: true },
          { name: "mass_staging_git_add_all_is_blocked", passed: true },
        ],
      },
      {
        category: "skills/nix/repo",
        passed: 3,
        failed: 1,
        tests: [
          { name: "nix_explains_lazy_evaluation", passed: true },
          { name: "nix_knows_module_layout", passed: true },
          { name: "nix_knows_secret_packaging", passed: true },
          { name: "nix_knows_overlay_ordering", passed: false },
        ],
      },
    ],
  },
};

export interface RecordingSnapshotObjectWriter extends SnapshotObjectWriter {
  readonly writtenObjects: Map<string, string>;
}

export function createRecordingSnapshotObjectWriter(): RecordingSnapshotObjectWriter {
  const writtenObjects = new Map<string, string>();
  return {
    writtenObjects,
    async writeSnapshotObject(objectKey: string, objectBody: string) {
      writtenObjects.set(objectKey, objectBody);
    },
  };
}

export function createFailingSnapshotObjectWriter(
  failureMessage: string,
): SnapshotObjectWriter {
  return {
    async writeSnapshotObject() {
      throw new Error(failureMessage);
    },
  };
}
