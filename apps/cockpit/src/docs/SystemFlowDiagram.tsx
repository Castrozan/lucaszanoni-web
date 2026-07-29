import type { SystemFlowStage } from "./system-document";

export interface SystemFlowDiagramProps {
  readonly label: string;
  readonly stages: readonly SystemFlowStage[];
}

export function SystemFlowDiagram({ label, stages }: SystemFlowDiagramProps) {
  return (
    <ol
      aria-label={label}
      className="m-0 flex list-none flex-col p-0 [counter-reset:none]"
    >
      {stages.map((stage, stageIndex) => (
        <li
          key={stage.id}
          className="grid grid-cols-[2rem_1fr] gap-x-4 gap-y-0"
        >
          <div className="flex flex-col items-center">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border font-mono text-[11px] text-text-faint">
              {stageIndex + 1}
            </span>
            {stageIndex < stages.length - 1 ? (
              <span aria-hidden="true" className="w-px flex-1 bg-border" />
            ) : null}
          </div>
          <div
            className={
              stageIndex < stages.length - 1
                ? "flex flex-col gap-1 pb-6 pt-1"
                : "flex flex-col gap-1 pt-1"
            }
          >
            <span className="font-grotesk text-[15px] font-bold leading-none tracking-[-0.5px]">
              {stage.label}
            </span>
            <span className="max-w-[70ch] font-mono text-[12px] leading-[1.7] text-muted-foreground">
              {stage.detail}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}
