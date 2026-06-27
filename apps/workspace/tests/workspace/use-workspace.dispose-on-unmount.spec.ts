import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook } from "@testing-library/react";
import { useWorkspace } from "../../src/workspace/use-workspace";
import { createInMemoryComputeAdapter } from "../../src/workspace/in-memory-compute-adapter";
import type { CockpitComputePort } from "../../src/workspace/compute-port";
import { createFakeStorage } from "../support/fake-web-storage";

afterEach(cleanup);

describe("useWorkspace disposes the compute adapter on unmount", () => {
  it("closes the active machine's compute transport when the workspace unmounts", () => {
    const dispose = vi.fn();
    const createCompute = (): CockpitComputePort => ({
      ...createInMemoryComputeAdapter(),
      dispose,
    });

    const { unmount } = renderHook(() =>
      useWorkspace({ storage: createFakeStorage(), createCompute }),
    );

    expect(dispose).not.toHaveBeenCalled();
    unmount();
    expect(dispose).toHaveBeenCalledTimes(1);
  });
});
