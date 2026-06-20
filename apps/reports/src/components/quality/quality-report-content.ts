import { REPORTS_MOUNT_PATH } from "@lucaszanoni-web/config";

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
