import type { ComponentType } from "react";
import type { ZodType } from "zod";

export interface ComponentCatalogEntry<
  PropsSchema extends ZodType = ZodType,
> {
  readonly catalogEntryName: string;
  readonly catalogEntryDescription: string;
  readonly propsValidationSchema: PropsSchema;
  readonly reactComponentRenderer: ComponentType<unknown>;
  readonly supportedLifecycleStates: readonly ComponentRenderingLifecycleStateName[];
}

export type ComponentRenderingLifecycleStateName =
  | "input-available"
  | "output-available"
  | "output-error";
