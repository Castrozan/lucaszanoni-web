import assert from "node:assert/strict";
import test from "node:test";
import { serviceBindingMatches } from "../../cloudflare/worker-bindings.mjs";

test("service binding entrypoints match only the same named or default target", () => {
  const entrypoints = [undefined, "default", "SnapshotReader"];
  const expectedMatches = [
    [true, true, false],
    [true, true, false],
    [false, false, true],
  ];
  for (const [actualIndex, actualEntrypoint] of entrypoints.entries()) {
    for (const [expectedIndex, expectedEntrypoint] of entrypoints.entries()) {
      assert.equal(
        serviceBindingMatches(
          {
            type: "service",
            name: "APP",
            service: "target",
            entrypoint: actualEntrypoint,
          },
          { binding: "APP", service: "target", entrypoint: expectedEntrypoint },
        ),
        expectedMatches[actualIndex][expectedIndex],
        `${actualEntrypoint} must match ${expectedEntrypoint} only when their entrypoints are equivalent`,
      );
    }
  }
});
