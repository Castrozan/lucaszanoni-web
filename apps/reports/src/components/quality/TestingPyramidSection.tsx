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

export function TestingPyramidSection() {
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
            6 scenarios · NPS 0-100 with penalties · tests/run.sh --e2e
          </div>
        </div>
        <div className={`${tierBaseClassName} max-w-[72%]`}>
          <div className={tierTitleClassName}>Tier 2, Integration</div>
          <div className={tierDescriptionClassName}>
            claude -p with the real CLAUDE.md, stream-json tool-call parsing,
            workspace file checks.
          </div>
          <div className={tierMetaClassName}>
            7 scenarios · NPS 0-100 · tests/run.sh --integration
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
            , gated in CI and pre-push.
          </div>
          <div className={tierMetaClassName}>
            183 tests / 14 categories · 3-day max age · tests/run.sh --evals
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
