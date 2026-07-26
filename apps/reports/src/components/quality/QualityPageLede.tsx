import {
  formatMetricsGeneratedDate,
  type QualityMetrics,
} from "../../data/quality-metrics";
import {
  qualityContentLinkClassName,
  qualityIssueHref,
  qualityLedeClassName,
} from "./quality-report-content";

export interface QualityPageLedeProps {
  readonly metrics: QualityMetrics | null;
}

export function QualityPageLede({ metrics }: QualityPageLedeProps) {
  return (
    <p className={qualityLedeClassName}>
      This repo treats its own AI agent like production software: a test
      pyramid, a regression gate, scored end-to-end runs, and experiments on how
      instructions are loaded. This page is the canonical record of that system,
      originally written up in{" "}
      <a className={qualityContentLinkClassName} href={qualityIssueHref}>
        issue #70
      </a>
      . The prose is written by hand; every count in it comes from the snapshot
      the dotfiles pipeline ingested under its own versioned contract
      {metrics ? (
        <>
          , measured at commit <code>{metrics.generatedCommit}</code> on{" "}
          {formatMetricsGeneratedDate(metrics.generatedAt)}
        </>
      ) : (
        ", so the counts appear once that snapshot lands"
      )}
      .
    </p>
  );
}
