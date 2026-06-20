import { REPORTS_MOUNT_PATH } from "@lucaszanoni-web/config";

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

export const instructionLoadingDiagram = `~/.claude/CLAUDE.md  →  @AGENTS.md (alwaysApply: true)
                              │
                        core.md (125 lines, 25 sections)
                              │
        ┌─────────────────────┼──────────────────────┐
   Session Start          PostCompact             Subagents
   (natural load)   (hook re-injects top 10)   (CLAUDE.md in workspace)`;
