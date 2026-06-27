export interface StructuredComponentOutput {
  readonly componentName: string;
  readonly componentProperties: Record<string, unknown>;
  readonly childComponents?: readonly StructuredComponentOutput[];
}

export interface StructuredComponentOutputWithLifecycle {
  readonly componentOutput: StructuredComponentOutput;
  readonly currentLifecyclePhase: "input-available" | "output-available" | "output-error";
  readonly toolCallIdentifier: string;
  readonly errorMessage?: string;
}
