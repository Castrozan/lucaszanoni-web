import overviewSchema from "./generated/verdr-overview-v1.schema.json";

export const qualityOverviewPayloadSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  additionalProperties: false,
  required: ["overview", "workflow", "detailsBaseUrl"],
  properties: {
    overview: overviewSchema,
    workflow: {
      type: "object",
      additionalProperties: false,
      required: [
        "repository",
        "revision",
        "runId",
        "runAttempt",
        "runUrl",
        "conclusion",
        "startedAt",
        "completedAt",
      ],
      properties: {
        repository: { type: "string", const: "Castrozan/.dotfiles" },
        revision: { type: "string", pattern: "^[a-f0-9]{40}$" },
        runId: { type: "string", pattern: "^[1-9][0-9]*$" },
        runAttempt: { type: "integer", minimum: 1 },
        runUrl: { type: "string", format: "uri" },
        conclusion: {
          enum: [
            "success",
            "failure",
            "cancelled",
            "timed_out",
            "action_required",
            "neutral",
            "skipped",
            "stale",
            "startup_failure",
          ],
        },
        startedAt: { type: "string", format: "date-time" },
        completedAt: { type: "string", format: "date-time" },
      },
    },
    detailsBaseUrl: {
      type: "string",
      format: "uri",
      pattern:
        "^https://[^/?#@]+/(?:[^?#]*/)?overview/[1-9][0-9]*/[1-9][0-9]*/$",
    },
  },
} as const;
