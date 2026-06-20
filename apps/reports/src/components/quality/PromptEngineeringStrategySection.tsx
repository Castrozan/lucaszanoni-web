import { Card } from "@lucaszanoni-web/design-system";
import {
  qualityListClassName,
  qualityPanelClassName,
  qualitySectionHeadingClassName,
} from "./quality-report-content";

export function PromptEngineeringStrategySection() {
  return (
    <>
      <h2 className={qualitySectionHeadingClassName}>
        Prompt-engineering strategy
      </h2>
      <Card className={qualityPanelClassName}>
        <ul className={qualityListClassName}>
          <li>
            <b>Structure</b>, XML tags isolate sections; the model treats each
            as a discrete rule boundary.
          </li>
          <li>
            <b>Tone</b>, zero ambiguity. &quot;No comments&quot;, not
            &quot;avoid when possible&quot;. Every sentence is a constraint.
          </li>
          <li>
            <b>Priority</b>, an <code>{"<override>"}</code> block at line 1
            establishes custom over default.
          </li>
          <li>
            <b>Density</b>, 125 lines / 25 rules, about 5 lines each. Dense
            prose, no tutorials.
          </li>
          <li>
            <b>Reinforcement</b>, a PostCompact hook re-injects the top 10 rules
            after context compaction.
          </li>
          <li>
            <b>Loading</b>, @reference (83) over inline (76) over system-prompt
            (67).
          </li>
        </ul>
      </Card>
    </>
  );
}
