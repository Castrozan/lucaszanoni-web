export type ComponentRenderingLifecycleState =
  | ComponentRenderingInputAvailableState
  | ComponentRenderingOutputAvailableState
  | ComponentRenderingOutputErrorState;

export interface ComponentRenderingInputAvailableState {
  readonly lifecyclePhase: "input-available";
  readonly toolCallInputArguments: Record<string, unknown>;
}

export interface ComponentRenderingOutputAvailableState {
  readonly lifecyclePhase: "output-available";
  readonly toolCallOutputData: Record<string, unknown>;
}

export interface ComponentRenderingOutputErrorState {
  readonly lifecyclePhase: "output-error";
  readonly errorMessage: string;
  readonly errorDetails: Record<string, unknown> | null;
}
