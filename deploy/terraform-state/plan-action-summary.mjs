import { isDeepStrictEqual } from "node:util";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const forbiddenActionCategories = ["create", "replace", "destroy"];

function categorizeChange(change) {
  const actions = change.change.actions.join(",");
  const importing = Boolean(change.change.importing);
  if (actions === "no-op") return importing ? "import" : "no-op";
  if (actions === "update") return importing ? "import-with-update" : "update";
  if (actions === "create") return "create";
  if (actions === "delete") return "destroy";
  if (actions === "delete,create" || actions === "create,delete") {
    return "replace";
  }
  if (actions === "forget") return "forget";
  return `unrecognized:${actions}`;
}

function changedAttributeNames(change) {
  const before = change.change.before ?? {};
  const after = change.change.after ?? {};
  const unknownAfter = change.change.after_unknown ?? {};
  const names = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...names]
    .filter(
      (name) =>
        unknownAfter[name] === true ||
        !isDeepStrictEqual(before[name], after[name]),
    )
    .sort();
}

export function summarizePlanActions(plan) {
  const counts = {};
  const resources = [];
  for (const change of plan.resource_changes ?? []) {
    if (change.mode !== "managed") continue;
    const category = categorizeChange(change);
    counts[category] = (counts[category] ?? 0) + 1;
    resources.push({
      address: change.address,
      category,
      changedAttributes: category.includes("update")
        ? changedAttributeNames(change)
        : [],
    });
  }
  const violations = resources.filter(
    ({ category }) =>
      forbiddenActionCategories.includes(category) ||
      category.startsWith("unrecognized:"),
  );
  return { counts, resources, violations };
}

export function formatPlanActionSummary({ counts, resources }) {
  const lines = resources
    .filter(({ category }) => category !== "no-op")
    .map(({ address, category, changedAttributes }) =>
      changedAttributes.length > 0
        ? `${category} ${address} [${changedAttributes.join(", ")}]`
        : `${category} ${address}`,
    );
  const totals = Object.entries(counts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([category, count]) => `${category}=${count}`)
    .join(" ");
  return [...lines, `Plan summary: ${totals || "no managed resources"}`].join(
    "\n",
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [planPath, enforcement] = process.argv.slice(2);
  const summary = summarizePlanActions(
    JSON.parse(readFileSync(planPath, "utf8")),
  );
  console.log(formatPlanActionSummary(summary));
  if (enforcement === "--forbid-live-changes" && summary.violations.length) {
    console.error(
      `HARD STOP: plan would ${summary.violations.map(({ category, address }) => `${category} ${address}`).join(", ")}`,
    );
    process.exitCode = 1;
  }
}
