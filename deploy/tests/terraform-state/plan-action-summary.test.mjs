import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatPlanActionSummary,
  summarizePlanActions,
} from "../../terraform-state/plan-action-summary.mjs";

test("summarizes imports and drift while flagging any live create, replace or destroy", () => {
  const change = (address, actions, extra = {}) => ({
    address,
    mode: "managed",
    change: { actions, before: {}, after: {}, ...extra },
  });
  const plan = {
    resource_changes: [
      change("a.imported", ["no-op"], { importing: { id: "x" } }),
      change("a.drifted", ["update"], {
        importing: { id: "y" },
        before: { content: "old", name: "same" },
        after: { content: "new", name: "same" },
      }),
      change("a.created", ["create"]),
      change("a.replaced", ["delete", "create"]),
      change("a.destroyed", ["delete"]),
      { address: "data.x", mode: "data", change: { actions: ["read"] } },
    ],
  };
  const summary = summarizePlanActions(plan);
  assert.deepEqual(summary.counts, {
    import: 1,
    "import-with-update": 1,
    create: 1,
    replace: 1,
    destroy: 1,
  });
  assert.deepEqual(
    summary.violations.map(({ address }) => address),
    ["a.created", "a.replaced", "a.destroyed"],
  );
  const formatted = formatPlanActionSummary(summary);
  assert.match(formatted, /import-with-update a\.drifted \[content\]/);
  assert.match(
    formatted,
    /Plan summary: create=1 destroy=1 import=1 import-with-update=1 replace=1$/,
  );
  assert.doesNotMatch(formatted, /old|new/);
});
