export function WhatChangedSection() {
  return (
    <>
      <h2>What changed</h2>
      <div className="cols">
        <div className="panel">
          <b>New</b>
          <ul>
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
        </div>
        <div className="panel">
          <b>Fixed</b>
          <ul>
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
        </div>
      </div>
      <div className="panel">
        <b>Key finding</b>
        <p>
          Opus scored NPS 100 on the workflow scenario, which proves the
          instructions work when the model has enough thinking time. The
          failures were model-capacity gaps from the adaptive-thinking
          regression, not instruction gaps.
        </p>
      </div>
    </>
  );
}
