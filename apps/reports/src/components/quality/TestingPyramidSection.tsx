import type { QualityMetrics } from "../../data/quality-metrics";
import {
  baselineDashboardHref,
  qualityContentLinkClassName,
  qualityLedeClassName,
  qualitySectionHeadingClassName,
} from "./quality-report-content";

const tierBaseClassName =
  "mx-auto my-2 rounded-lg border border-border bg-surface px-[1.1rem] py-[0.8rem]";
const tierTitleClassName = "font-semibold text-primary";
const tierDescriptionClassName = "mt-0.5 text-sm text-muted-foreground";
const tierMetaClassName = "mt-1.5 text-xs text-muted-foreground";

export interface TestingPyramidSectionProps {
  readonly metrics: QualityMetrics;
}

export function TestingPyramidSection({ metrics }: TestingPyramidSectionProps) {
  return (
    <>
      <h2 className={qualitySectionHeadingClassName}>The testing pyramid</h2>
      <div className="my-5">
        <div className={`${tierBaseClassName} max-w-[58%]`}>
          <div className={tierTitleClassName}>Tier 3, E2E</div>
          <div className={tierDescriptionClassName}>
            Real interactive tmux sessions, real claude, hooks firing.
            Dual-signal assertions: terminal output plus workspace artifacts.
          </div>
          <div className={tierMetaClassName}>
            {metrics.endToEndScenarioCount} scenarios · NPS 0-100 with penalties
            · tests/run.sh --e2e
          </div>
        </div>
        <div className={`${tierBaseClassName} max-w-[72%]`}>
          <div className={tierTitleClassName}>Tier 2, Integration</div>
          <div className={tierDescriptionClassName}>
            claude -p with the real CLAUDE.md, stream-json tool-call parsing,
            workspace file checks.
          </div>
          <div className={tierMetaClassName}>
            {metrics.integrationScenarioCount} scenarios · NPS 0-100 ·
            tests/run.sh --integration
          </div>
        </div>
        <div className={`${tierBaseClassName} max-w-[86%] border-primary`}>
          <div className={tierTitleClassName}>Tier 1, Static evals</div>
          <div className={tierDescriptionClassName}>
            Prompt evals on haiku across compliance, routing, navigation and
            knowledge. This is the{" "}
            <a
              className={qualityContentLinkClassName}
              href={baselineDashboardHref}
            >
              live baseline
            </a>
            , gated in CI against a fixed pass-rate floor. The pre-push hook
            runs the lint and quick tiers, not the evals.
          </div>
          <div className={tierMetaClassName}>
            {metrics.staticEvals.totalTests} tests /{" "}
            {metrics.staticEvals.suiteCount} suites · absolute pass-rate floors
            · tests/run.sh --evals
          </div>
        </div>
        <div className={`${tierBaseClassName} max-w-full`}>
          <div className={tierTitleClassName}>Tier 0, Quick</div>
          <div className={tierDescriptionClassName}>
            bats, pytest, QML, frontmatter. No model calls.
          </div>
          <div className={tierMetaClassName}>
            runs in under 10s · tests/run.sh --quick
          </div>
        </div>
      </div>
      <p className={qualityLedeClassName}>
        An A/B test runner sits alongside the pyramid to compare
        instruction-loading configs.
      </p>
    </>
  );
}
