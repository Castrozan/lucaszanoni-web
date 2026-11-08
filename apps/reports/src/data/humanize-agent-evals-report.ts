import type {
  AgentEvalsCase,
  AgentEvalsCategory,
  AgentEvalsHeader,
  AgentEvalsUncoveredFile,
} from "./agent-evals-report";

export const categoryFloorRate = 0.85;

const unchangedThresholdInPoints = 0.05;
const percentFractionDigits = 1;

export type VerdictTone = "positive" | "negative" | "caution";

export interface Verdict {
  readonly label: string;
  readonly tone: VerdictTone;
  readonly detail: string;
}

export interface CategoryRow {
  readonly name: string;
  readonly rate: number | null;
  readonly passes: number;
  readonly samples: number;
  readonly belowFloor: boolean;
  readonly nonPassingCases: readonly AgentEvalsCase[];
}

export interface UncoveredGroup {
  readonly label: string;
  readonly paths: readonly string[];
}

const uncoveredKindLabels: Record<AgentEvalsUncoveredFile["kind"], string> = {
  instruction: "instructions",
  cli: "command-line scripts",
  mcp: "MCP servers",
};

export function humanizeName(name: string): string {
  return name.replace(/[_-]+/g, " ").trim();
}

const skillCategoryPrefix = "skills/";

export function humanizeCategoryName(category: string): string {
  const segments = category
    .replace(skillCategoryPrefix, "")
    .split("/")
    .filter((segment, index, all) => segment !== all[index - 1]);
  return segments.map(humanizeName).join(" / ");
}

export function humanizeCaseKey(caseKey: string): string {
  return humanizeName(caseKey.slice(caseKey.lastIndexOf("/") + 1));
}

export function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function formatMeasuredDate(generatedAt: string): string {
  return generatedAt.slice(0, 10);
}

export function countNoun(
  count: number,
  singularNoun: string,
  pluralNoun: string,
): string {
  return `${count} ${count === 1 ? singularNoun : pluralNoun}`;
}

export function describeRuns(passes: number, samples: number): string {
  return `${passes} of ${samples} ${samples === 1 ? "run" : "runs"} passed`;
}

export function describeCaseRuns(
  measuredCase: Pick<AgentEvalsCase, "status" | "passes" | "samples">,
): string {
  return measuredCase.status === "unmeasured"
    ? "not measured yet"
    : describeRuns(measuredCase.passes, measuredCase.samples);
}

export function describeRateChange(
  currentRate: number,
  previousRate: number | null,
): string | null {
  if (previousRate === null) {
    return null;
  }
  const deltaInPoints = (currentRate - previousRate) * 100;
  if (Math.abs(deltaInPoints) < unchangedThresholdInPoints) {
    return "unchanged";
  }
  const direction = deltaInPoints > 0 ? "up" : "down";
  return `${direction} ${Math.abs(deltaInPoints).toFixed(percentFractionDigits)} points`;
}

function describeRateFact(header: AgentEvalsHeader): string {
  if (header.rate === null) {
    return "No checks were measured.";
  }
  const fact = `The agent got ${header.rate.passes} of ${header.rate.samples} checks right (${formatPercent(header.rate.value)})`;
  const change = describeRateChange(header.rate.value, header.previousRate);
  return change === null
    ? `${fact}.`
    : `${fact}, ${change} from the previous run.`;
}

export function buildVerdict(header: AgentEvalsHeader): Verdict {
  if (header.status === "invalid") {
    return {
      label: "Not trustworthy",
      tone: "caution",
      detail: header.invalidReason ?? "",
    };
  }
  return {
    label: header.status === "approved" ? "Passing" : "Failing",
    tone: header.status === "approved" ? "positive" : "negative",
    detail: describeRateFact(header),
  };
}

export function describeSubject(header: AgentEvalsHeader): string {
  const { client, model } = header.profile.subject;
  return model ? `${client} ${model}` : client;
}

function rateSortKey(rate: number | null): number {
  return rate ?? Number.POSITIVE_INFINITY;
}

export function buildCategoryRows(
  categories: readonly AgentEvalsCategory[],
): CategoryRow[] {
  return categories
    .map((category) => ({
      name: humanizeCategoryName(category.name),
      rate: category.rate,
      passes: category.passes,
      samples: category.samples,
      belowFloor: category.rate !== null && category.rate < categoryFloorRate,
      nonPassingCases: category.groups
        .flatMap((group) => group.cases)
        .filter((measuredCase) => measuredCase.status !== "passed"),
    }))
    .sort(
      (first, second) => rateSortKey(first.rate) - rateSortKey(second.rate),
    );
}

export function groupUncoveredByKind(
  uncovered: readonly AgentEvalsUncoveredFile[],
): UncoveredGroup[] {
  return (Object.keys(uncoveredKindLabels) as AgentEvalsUncoveredFile["kind"][])
    .map((kind) => ({
      label: uncoveredKindLabels[kind],
      paths: uncovered
        .filter((file) => file.kind === kind)
        .map((file) => file.path),
    }))
    .filter((group) => group.paths.length > 0);
}
