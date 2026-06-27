import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useWorkspace } from "../../src/workspace/use-workspace";
import { isCockpitAgentDriverKind } from "../../src/workspace/agent-driver";
import { createInMemoryComputeAdapter } from "../../src/workspace/in-memory-compute-adapter";
import type {
  CockpitComputePort,
  ComputeWindowSpec,
} from "../../src/workspace/compute-port";
import type { WorkspaceRegistryState } from "../../src/workspace/workspace-registry";
import { createFakeStorage } from "../support/fake-web-storage";

afterEach(cleanup);

function createOpenWindowSpecRecordingCompute(
  recordedOpenWindowSpecs: ComputeWindowSpec[],
) {
  return (seed: WorkspaceRegistryState): CockpitComputePort => {
    const inMemoryCompute = createInMemoryComputeAdapter({
      initialState: seed,
    });
    return {
      ...inMemoryCompute,
      openWindow(sessionKey, spec) {
        recordedOpenWindowSpecs.push(spec);
        return inMemoryCompute.openWindow(sessionKey, spec);
      },
    };
  };
}

describe("useWorkspace preserves the title-equals-driver recovery invariant", () => {
  it("opens every driver window with a title the authoritative re-list recovers as that driver", async () => {
    const recordedOpenWindowSpecs: ComputeWindowSpec[] = [];
    const { result } = renderHook(() =>
      useWorkspace({
        storage: createFakeStorage(),
        createCompute: createOpenWindowSpecRecordingCompute(
          recordedOpenWindowSpecs,
        ),
      }),
    );

    await act(async () => {
      await result.current.openSession("Platform");
    });
    await act(async () => {
      await result.current.openWindow("codex");
    });
    await act(async () => {
      await result.current.openWindow("claude");
    });

    expect(recordedOpenWindowSpecs.map((spec) => spec.driver)).toEqual([
      "codex",
      "claude",
    ]);
    for (const spec of recordedOpenWindowSpecs) {
      expect(spec.title).toBe(spec.driver);
      expect(isCockpitAgentDriverKind(spec.title)).toBe(true);
    }
  });
});
