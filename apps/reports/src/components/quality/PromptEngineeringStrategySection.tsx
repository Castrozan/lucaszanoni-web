import { Card } from "@platform/design-system";
import type { QualityMetrics } from "../../data/quality-metrics";
import {
  qualityListClassName,
  qualityPanelClassName,
  qualitySectionHeadingClassName,
} from "./quality-report-content";

export interface PromptEngineeringStrategySectionProps {
  readonly metrics: QualityMetrics;
}

export function PromptEngineeringStrategySection({
  metrics,
}: PromptEngineeringStrategySectionProps) {
  const averageLinesPerRuleBlock = Math.round(
    metrics.coreRules.lineCount / metrics.coreRules.ruleBlockCount,
  );
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
            <b>Density</b>, {metrics.coreRules.lineCount} lines /{" "}
            {metrics.coreRules.ruleBlockCount} rule blocks, about{" "}
            {averageLinesPerRuleBlock} lines each. Dense prose, no tutorials.
          </li>
          <li>
            <b>Reinforcement</b>, {metrics.hooks.entryPointCount} hooks across{" "}
            {metrics.hooks.wiredEvents.length} events carry what prose cannot: a
            session-start recovery hook rebuilds durable state after compaction,
            and an end-of-turn guard bounces replies that break the format
            contract.
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
