import { baselineDashboardHref } from "./quality-report-content";

export function TestingPyramidSection() {
  return (
    <>
      <h2>The testing pyramid</h2>
      <div className="pyramid">
        <div className="tier tier-level-3">
          <div className="tier-title">Tier 3, E2E</div>
          <div className="tier-description">
            Real interactive tmux sessions, real claude, hooks firing.
            Dual-signal assertions: terminal output plus workspace artifacts.
          </div>
          <div className="tier-meta">
            6 scenarios · NPS 0-100 with penalties · tests/run.sh --e2e
          </div>
        </div>
        <div className="tier tier-level-2">
          <div className="tier-title">Tier 2, Integration</div>
          <div className="tier-description">
            claude -p with the real CLAUDE.md, stream-json tool-call parsing,
            workspace file checks.
          </div>
          <div className="tier-meta">
            7 scenarios · NPS 0-100 · tests/run.sh --integration
          </div>
        </div>
        <div className="tier tier-level-1">
          <div className="tier-title">Tier 1, Static evals</div>
          <div className="tier-description">
            Prompt evals on haiku across compliance, routing, navigation and
            knowledge. This is the{" "}
            <a href={baselineDashboardHref}>live baseline</a>, gated in CI and
            pre-push.
          </div>
          <div className="tier-meta">
            183 tests / 14 categories · 3-day max age · tests/run.sh --evals
          </div>
        </div>
        <div className="tier tier-level-0">
          <div className="tier-title">Tier 0, Quick</div>
          <div className="tier-description">
            bats, pytest, QML, frontmatter. No model calls.
          </div>
          <div className="tier-meta">
            runs in under 10s · tests/run.sh --quick
          </div>
        </div>
      </div>
      <p className="lede">
        An A/B test runner sits alongside the pyramid to compare
        instruction-loading configs.
      </p>
    </>
  );
}
