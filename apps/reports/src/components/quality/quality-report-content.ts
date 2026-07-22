import { REPORTS_MOUNT_PATH } from "@platform/config";
import type { CoreRulesMetrics } from "../../data/quality-metrics";

export const qualitySectionHeadingClassName =
  "mt-9 mb-3 border-b border-border pb-1.5 text-lg font-semibold";
export const qualityLedeClassName = "mb-5 max-w-[74ch] text-muted-foreground";
export const qualityPanelClassName = "my-4 gap-2 rounded-lg px-5 py-4";
export const qualityListClassName = "mt-2 list-disc space-y-1.5 pl-5";
export const qualityContentLinkClassName = "text-primary";

export const reportsHubHref = REPORTS_MOUNT_PATH;
export const baselineDashboardHref = `${REPORTS_MOUNT_PATH}baseline/`;
export const qualityIssueHref =
  "https://github.com/Castrozan/.dotfiles/issues/70";

export function buildInstructionLoadingDiagram(
  coreRules: CoreRulesMetrics,
): string {
  return `agents/core_rules/core.md  (${coreRules.lineCount} lines, ${coreRules.ruleBlockCount} rule blocks)
                              │
              rendered into the harness by nix, at every session start
                              │
        ┌─────────────────────┼──────────────────────┐
   Interactive           After compaction          Subagents
   (+ reply-shape      (recovery hook re-reads   (CLAUDE.md picked up
   preferences file)    HEARTBEAT / deep-work     in the workspace)
                        state back off disk)`;
}
