import { Card } from "@platform/design-system";
import {
  qualityListClassName,
  qualityPanelClassName,
  qualitySectionHeadingClassName,
} from "./quality-report-content";

export function WhatChangedSection() {
  return (
    <>
      <h2 className={qualitySectionHeadingClassName}>What changed</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="gap-2 rounded-lg px-5 py-4">
          <b>New</b>
          <ul className={qualityListClassName}>
            <li>
              E2E tmux test framework (<code>agents/evals/e2e/</code>), real
              sessions, terminal parser, dual-signal assertions, NPS scoring.
            </li>
            <li>
              Integration framework (<code>agents/evals/integration/</code>),
              stream-json parsing, 7 scenarios.
            </li>
            <li>A/B test runner for instruction-loading configs.</li>
            <li>
              PostCompact reinforcement hook, re-injects the 10 most-violated
              rules.
            </li>
            <li>
              Pre-push eval baseline enforcement, local gate, 3-day max age (was
              7, CI-only).
            </li>
          </ul>
        </Card>
        <Card className="gap-2 rounded-lg px-5 py-4">
          <b>Fixed</b>
          <ul className={qualityListClassName}>
            <li>
              deep-work-recovery.py ignored PostCompact events (accepted only
              SessionStart).
            </li>
            <li>Stale hooks.yaml referenced deleted hooks.</li>
            <li>A hardcoded absolute path in nix-rebuild-trigger.py.</li>
            <li>
              NPS scoring was bonus-only and inflated scores, penalties added.
            </li>
            <li>
              Integration tests used --system-prompt, the worst loading method.
            </li>
            <li>Eval baseline was 7 days stale with no local enforcement.</li>
          </ul>
        </Card>
      </div>
      <Card className={qualityPanelClassName}>
        <b>Key finding</b>
        <p>
          Opus scored NPS 100 on the workflow scenario, which proves the
          instructions work when the model has enough thinking time. The
          failures were model-capacity gaps from the adaptive-thinking
          regression, not instruction gaps.
        </p>
      </Card>
    </>
  );
}
