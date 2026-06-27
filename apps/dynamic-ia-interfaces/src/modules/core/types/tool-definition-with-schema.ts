import type { ZodType } from "zod";

export interface ToolDefinitionWithSchema<
  InputSchema extends ZodType = ZodType,
  OutputSchema extends ZodType = ZodType,
> {
  readonly toolName: string;
  readonly toolDescription: string;
  readonly inputValidationSchema: InputSchema;
  readonly outputValidationSchema: OutputSchema;
  readonly requiresUserApproval: boolean | ((input: unknown) => Promise<boolean>);
  readonly executeToolAction: (
    input: unknown,
  ) => Promise<unknown>;
}
