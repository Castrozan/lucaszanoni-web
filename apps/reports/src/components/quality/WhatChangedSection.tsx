import { Card } from "@platform/design-system";
import {
  qualityListClassName,
  qualityPanelClassName,
  qualitySectionHeadingClassName,
} from "./quality-report-content";

export function WhatChangedSection() {
  return (
    <>
      <h2 className={qualitySectionHeadingClassName}>
        What the investigation changed
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="gap-2 rounded-lg px-5 py-4">
          <b>New</b>
          <ul className={qualityListClassName}>
            <li>
              E2E test framework (<code>agents/evals/e2e/</code>), real
              sessions, terminal parser, dual-signal assertions.
            </li>
            <li>
              Integration framework (<code>agents/evals/integration/</code>),
              stream-json tool-call parsing.
            </li>
            <li>A/B test runner for instruction-loading configs.</li>
            <li>
              PostCompact reinforcement hook, re-injects the 10 most-violated
              rules. It has since been replaced by a recovery hook that restores
              durable state off disk instead of re-injecting rule text.
            </li>
            <li>
              Pre-push eval baseline enforcement with a 3-day max age. Both were
              dropped later: the suite is too slow and too flaky to gate a push
              on, so CI now guards an absolute pass-rate floor and the baseline
              is re-recorded deliberately rather than on a clock.
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
              Scenario scoring was bonus-only and inflated results, so it was
              replaced by pass or fail on asserted behaviour.
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
          The instructions were not the weak link. Every scenario the agent
          failed was a model-capacity gap from the adaptive-thinking regression,
          which is why the answer was continuous measurement rather than more
          rules. The paired experiment in Results now carries that claim as a
          measured delta instead of an anecdote.
        </p>
      </Card>
    </>
  );
}
