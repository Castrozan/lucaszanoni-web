import { describe, expect, it } from "vitest";
import {
  countNoun,
  buildCategoryRows,
  buildVerdict,
  describeCaseRuns,
  describeRateChange,
  describeRuns,
  groupUncoveredByKind,
  humanizeCaseKey,
  humanizeCategoryName,
  humanizeName,
} from "../../src/data/humanize-agent-evals-report";
import { buildReasonBullets } from "../../src/data/humanize-verdict-reasons";
import { agentEvalsReportFixture } from "../components/baseline/agent-evals-report-fixture";

const { header, categories } = agentEvalsReportFixture;

describe("humanizeName", () => {
  it("turns snake_case and kebab-case into words", () => {
    expect(humanizeName("core_rules")).toBe("core rules");
    expect(humanizeName("end-to-end_workflows")).toBe("end to end workflows");
  });

  it("humanizes only the case part of a case key", () => {
    expect(humanizeCaseKey("core_rules/keeps_answers_short")).toBe(
      "keeps answers short",
    );
  });
});

describe("describeRateChange", () => {
  it("names a rise and a drop in points", () => {
    expect(describeRateChange(0.912, 0.9)).toBe("up 1.2 points");
    expect(describeRateChange(0.892, 0.9)).toBe("down 0.8 points");
  });

  it("calls a change under 0.05 points unchanged", () => {
    expect(describeRateChange(0.90004, 0.9)).toBe("unchanged");
  });

  it("omits the change without a previous rate", () => {
    expect(describeRateChange(0.9, null)).toBeNull();
  });
});

describe("buildVerdict", () => {
  it("states a failing run with its rate and unchanged phrase", () => {
    expect(buildVerdict(header)).toEqual({
      label: "Failing",
      tone: "negative",
      detail:
        "The agent got 469 of 521 checks right (90%), unchanged from the previous run.",
    });
  });

  it("omits the change phrase when there is no previous rate", () => {
    const verdict = buildVerdict({ ...header, previousRate: null });
    expect(verdict.detail).toBe("The agent got 469 of 521 checks right (90%).");
  });

  it("states an approved run as passing", () => {
    expect(buildVerdict({ ...header, status: "approved" })).toMatchObject({
      label: "Passing",
      tone: "positive",
    });
  });

  it("follows an untrustworthy run with its invalid reason", () => {
    expect(
      buildVerdict({
        ...header,
        status: "invalid",
        invalidReason: "The run was cut short.",
        rate: null,
      }),
    ).toEqual({
      label: "Not trustworthy",
      tone: "caution",
      detail: "The run was cut short.",
    });
  });
});

describe("buildReasonBullets", () => {
  it("humanizes and groups reasons by code in first-seen order", () => {
    expect(
      buildReasonBullets(header.reasons).map((bullet) => bullet.text),
    ).toEqual([
      "core rules fell below its floor",
      "2 instructions changed after they were last measured",
      "1 case has never been measured",
      "results dropped against the previous run",
      "Something unexpected.",
    ]);
  });

  it("keeps the original message as the title of a humanized bullet", () => {
    expect(buildReasonBullets(header.reasons)[0]!.title).toContain(
      "core_rules",
    );
  });

  it("pluralizes grouped removed and unmeasured cases", () => {
    const reasons = [
      { code: "caso-removido", message: "a" },
      { code: "caso-removido", message: "b" },
      { code: "caso-sem-resultado", message: "c" },
      { code: "caso-sem-resultado", message: "d" },
      { code: "baseline-vencida", message: "e" },
    ];
    expect(buildReasonBullets(reasons).map((bullet) => bullet.text)).toEqual([
      "2 recorded cases no longer exist",
      "2 cases have never been measured",
      "the measurement is too old",
    ]);
  });

  it("names the whole suite when the overall floor is missed", () => {
    expect(
      buildReasonBullets([{ code: "piso-geral", message: "x" }])[0]!.text,
    ).toBe("the whole suite fell below its floor");
  });
});

describe("humanizeCategoryName", () => {
  it("drops the skills prefix and a repeated skill segment", () => {
    expect(humanizeCategoryName("skills/browser/browser")).toBe("browser");
    expect(humanizeCategoryName("skills/coding/worktrees")).toBe(
      "coding / worktrees",
    );
    expect(humanizeCategoryName("end_to_end_workflows")).toBe(
      "end to end workflows",
    );
  });
});

describe("buildCategoryRows", () => {
  it("orders worst rate first and flags rows below the floor", () => {
    const rows = buildCategoryRows(categories);
    expect(rows.map((row) => [row.name, row.belowFloor])).toEqual([
      ["core rules", true],
      ["workflow compliance", false],
    ]);
  });

  it("keeps only non-passing cases for expansion", () => {
    const [coreRules, workflowCompliance] = buildCategoryRows(categories);
    expect(
      coreRules!.nonPassingCases.map((measuredCase) => measuredCase.name),
    ).toEqual(["controlled_language_explains_by_contrast"]);
    expect(workflowCompliance!.nonPassingCases).toEqual([]);
  });

  it("sorts unmeasured categories last", () => {
    const rows = buildCategoryRows([
      { name: "unmeasured", samples: 0, passes: 0, rate: null, groups: [] },
      ...categories,
    ]);
    expect(rows[rows.length - 1]!.name).toBe("unmeasured");
  });
});

describe("run descriptions", () => {
  it("counts runs", () => {
    expect(describeRuns(1, 2)).toBe("1 of 2 runs passed");
    expect(describeRuns(1, 1)).toBe("1 of 1 run passed");
  });

  it("says an unmeasured case has not been measured yet", () => {
    expect(
      describeCaseRuns({ status: "unmeasured", passes: 0, samples: 0 }),
    ).toBe("not measured yet");
  });
});

describe("groupUncoveredByKind", () => {
  it("groups paths under a readable label per kind and drops empty kinds", () => {
    expect(groupUncoveredByKind(agentEvalsReportFixture.uncovered)).toEqual([
      { label: "instructions", paths: ["core-rules/adaptive.md"] },
      {
        label: "command-line scripts",
        paths: [
          "scripts/retire-projections.py",
          "scripts/build_configuration.py",
        ],
      },
    ]);
  });
});

describe("countNoun", () => {
  it("keeps a single count singular and pluralizes the rest", () => {
    expect(countNoun(1, "case", "cases")).toBe("1 case");
    expect(countNoun(0, "case", "cases")).toBe("0 cases");
    expect(countNoun(12, "file has", "files have")).toBe("12 files have");
  });
});
