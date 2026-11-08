import type { AgentEvalsReport } from "../../../src/data/agent-evals-report";

export const agentEvalsReportFixture: AgentEvalsReport = {
  schemaVersion: 1,
  header: {
    project: "dotfiles-agent-instructions",
    generatedAt: "2026-11-08T01:04:57.898Z",
    commit: "cc9ceda15de4af8ebfb8be03213ad3cc53d94860",
    status: "failed",
    rate: {
      value: 0.9001919385796545,
      lower: 0.8714521615635992,
      upper: 0.9230734861186337,
      passes: 469,
      samples: 521,
    },
    previousRate: 0.9001919385796545,
    profile: { subject: { client: "codex", model: "gpt-6.1-sol" } },
    reasons: [
      {
        code: "piso-critico",
        category: "core_rules",
        message: 'Categoria crítica "core_rules" com 83,3%, abaixo do piso.',
      },
      { code: "instrucao-alterada", message: "alterada a", file: "a.md" },
      { code: "instrucao-alterada", message: "alterada b", file: "b.md" },
      { code: "caso-sem-resultado", message: "sem resultado" },
      { code: "regressao", message: "regressão" },
      { code: "codigo-desconhecido", message: "Something unexpected." },
    ],
  },
  categories: [
    {
      name: "workflow_compliance",
      samples: 10,
      passes: 10,
      rate: 1,
      groups: [
        {
          cases: [
            {
              key: "workflow_compliance/adaptive_delivery_holds_the_ceiling",
              name: "adaptive_delivery_holds_the_ceiling",
              status: "passed",
              passes: 2,
              samples: 2,
              flaky: true,
            },
          ],
        },
      ],
    },
    {
      name: "core_rules",
      samples: 6,
      passes: 5,
      rate: 5 / 6,
      groups: [
        {
          cases: [
            {
              key: "core_rules/controlled_language_explains_by_contrast",
              name: "controlled_language_explains_by_contrast",
              status: "failed",
              passes: 1,
              samples: 2,
              flaky: true,
            },
            {
              key: "core_rules/keeps_answers_short",
              name: "keeps_answers_short",
              status: "passed",
              passes: 2,
              samples: 2,
              flaky: false,
            },
          ],
        },
      ],
    },
  ],
  failures: [
    {
      key: "core_rules/controlled_language_explains_by_contrast",
      category: "core_rules",
      name: "controlled_language_explains_by_contrast",
      passes: 1,
      samples: 2,
      inherited: false,
      input: "Fix the divide bug.\n",
      expected: ["mentions the test", "keeps it short"],
      actualOutput: "Fixed it and added a docstring.",
      failedAssertions: ["no comments: found docstring on line 2"],
    },
    {
      key: "core_rules/bare_failure",
      category: "core_rules",
      name: "bare_failure",
      passes: 0,
      samples: 2,
      inherited: true,
      expected: [],
      failedAssertions: [],
    },
  ],
  flaky: [
    {
      key: "workflow_compliance/adaptive_delivery_holds_the_ceiling",
      passes: 1,
      samples: 2,
    },
  ],
  uncovered: [
    { kind: "cli", path: "scripts/retire-projections.py" },
    { kind: "cli", path: "scripts/build_configuration.py" },
    { kind: "instruction", path: "core-rules/adaptive.md" },
  ],
};
