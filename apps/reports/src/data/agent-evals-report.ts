import { useEffect, useState } from "react";
import { baselineReportJsonUrl } from "./report-artifact-sources";

export type AgentEvalsStatus = "approved" | "failed" | "invalid";

export interface AgentEvalsRate {
  readonly value: number;
  readonly lower: number;
  readonly upper: number;
  readonly passes: number;
  readonly samples: number;
}

export interface AgentEvalsReason {
  readonly code: string;
  readonly message: string;
  readonly category?: string;
  readonly caseKey?: string;
  readonly file?: string;
}

export interface AgentEvalsHeader {
  readonly project: string;
  readonly generatedAt: string;
  readonly commit?: string;
  readonly status: AgentEvalsStatus;
  readonly invalidReason?: string;
  readonly rate: AgentEvalsRate | null;
  readonly previousRate: number | null;
  readonly profile: {
    readonly subject: { readonly client: string; readonly model?: string };
  };
  readonly reasons: readonly AgentEvalsReason[];
}

export interface AgentEvalsCase {
  readonly key: string;
  readonly name: string;
  readonly status: "passed" | "failed" | "unmeasured";
  readonly passes: number;
  readonly samples: number;
  readonly flaky: boolean;
}

export interface AgentEvalsCategory {
  readonly name: string;
  readonly samples: number;
  readonly passes: number;
  readonly rate: number | null;
  readonly groups: readonly {
    readonly cases: readonly AgentEvalsCase[];
  }[];
}

export interface AgentEvalsFailure {
  readonly key: string;
  readonly category: string;
  readonly name: string;
  readonly passes: number;
  readonly samples: number;
  readonly inherited: boolean;
  readonly input?: string;
  readonly expected: readonly string[];
  readonly actualOutput?: string;
  readonly failedAssertions: readonly string[];
}

export interface AgentEvalsFlakyCase {
  readonly key: string;
  readonly passes: number;
  readonly samples: number;
}

export interface AgentEvalsUncoveredFile {
  readonly kind: "instruction" | "cli" | "mcp";
  readonly path: string;
}

export interface AgentEvalsReport {
  readonly schemaVersion: 1;
  readonly header: AgentEvalsHeader;
  readonly categories: readonly AgentEvalsCategory[];
  readonly failures: readonly AgentEvalsFailure[];
  readonly flaky: readonly AgentEvalsFlakyCase[];
  readonly uncovered: readonly AgentEvalsUncoveredFile[];
}

export type AgentEvalsReportState =
  | { readonly phase: "loading" }
  | { readonly phase: "error" }
  | { readonly phase: "ready"; readonly report: AgentEvalsReport };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function readAgentEvalsReport(value: unknown): AgentEvalsReport | null {
  if (!isRecord(value) || value.schemaVersion !== 1) {
    return null;
  }
  const hasExpectedShape =
    isRecord(value.header) &&
    Array.isArray(value.header.reasons) &&
    Array.isArray(value.categories) &&
    Array.isArray(value.failures) &&
    Array.isArray(value.flaky) &&
    Array.isArray(value.uncovered);
  return hasExpectedShape ? (value as unknown as AgentEvalsReport) : null;
}

export function useAgentEvalsReport(): AgentEvalsReportState {
  const [state, setState] = useState<AgentEvalsReportState>({
    phase: "loading",
  });
  useEffect(() => {
    let subscribed = true;
    fetch(baselineReportJsonUrl)
      .then((response) => (response.ok ? response.json() : null))
      .then((value) => {
        if (!subscribed) {
          return;
        }
        const report = readAgentEvalsReport(value);
        setState(report ? { phase: "ready", report } : { phase: "error" });
      })
      .catch(() => {
        if (subscribed) {
          setState({ phase: "error" });
        }
      });
    return () => {
      subscribed = false;
    };
  }, []);
  return state;
}
