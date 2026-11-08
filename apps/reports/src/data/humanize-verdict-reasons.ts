import type { AgentEvalsReason } from "./agent-evals-report";
import { humanizeCategoryName } from "./humanize-agent-evals-report";

export interface ReasonBullet {
  readonly text: string;
  readonly title?: string;
}

const groupedReasonCodes = new Set([
  "instrucao-alterada",
  "caso-sem-resultado",
  "caso-removido",
  "regressao",
  "baseline-vencida",
]);

interface ReasonGroup {
  readonly firstReason: AgentEvalsReason;
  readonly count: number;
}

function groupReasons(reasons: readonly AgentEvalsReason[]): ReasonGroup[] {
  const groups = new Map<string, ReasonGroup>();
  reasons.forEach((reason, index) => {
    const groupKey = groupedReasonCodes.has(reason.code)
      ? reason.code
      : `${reason.code}#${index}`;
    const existingGroup = groups.get(groupKey);
    groups.set(groupKey, {
      firstReason: existingGroup?.firstReason ?? reason,
      count: (existingGroup?.count ?? 0) + 1,
    });
  });
  return [...groups.values()];
}

function buildCategoryFloorBullet(reason: AgentEvalsReason): ReasonBullet {
  const categoryName = reason.category
    ? humanizeCategoryName(reason.category)
    : "the whole suite";
  return {
    text: `${categoryName} fell below its floor`,
    title: reason.message,
  };
}

function buildReasonGroupBullet({
  firstReason,
  count,
}: ReasonGroup): ReasonBullet {
  switch (firstReason.code) {
    case "piso-critico":
    case "piso-geral":
      return buildCategoryFloorBullet(firstReason);
    case "instrucao-alterada":
      return {
        text:
          count === 1
            ? "1 instruction changed after it was last measured"
            : `${count} instructions changed after they were last measured`,
      };
    case "caso-sem-resultado":
      return {
        text:
          count === 1
            ? "1 case has never been measured"
            : `${count} cases have never been measured`,
      };
    case "caso-removido":
      return {
        text:
          count === 1
            ? "1 recorded case no longer exists"
            : `${count} recorded cases no longer exist`,
      };
    case "regressao":
      return {
        text: "results dropped against the previous run",
        title: firstReason.message,
      };
    case "baseline-vencida":
      return {
        text: "the measurement is too old",
        title: firstReason.message,
      };
    default:
      return { text: firstReason.message };
  }
}

export function buildReasonBullets(
  reasons: readonly AgentEvalsReason[],
): ReasonBullet[] {
  return groupReasons(reasons).map((group) => buildReasonGroupBullet(group));
}
