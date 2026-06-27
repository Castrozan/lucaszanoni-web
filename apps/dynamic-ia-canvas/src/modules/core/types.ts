import { z } from "zod";

export const componentRenderingTierSchema = z.enum([
  "prebuilt",
  "template",
  "freeform",
]);

export type ComponentRenderingTier = z.infer<
  typeof componentRenderingTierSchema
>;

export const componentImportDeclarationSchema = z.object({
  module: z.string(),
  namedExports: z.array(z.string()),
});

export type ComponentImportDeclaration = z.infer<
  typeof componentImportDeclarationSchema
>;

export const componentPropDefinitionSchema = z.object({
  name: z.string(),
  type: z.string(),
  required: z.boolean(),
});

export type ComponentPropDefinition = z.infer<
  typeof componentPropDefinitionSchema
>;

export const generatedComponentSpecificationSchema = z.object({
  componentName: z.string(),
  title: z.string(),
  description: z.string(),
  imports: z.array(componentImportDeclarationSchema),
  props: z.array(componentPropDefinitionSchema),
  jsxCode: z.string(),
  dependencies: z.array(z.string()),
  tier: componentRenderingTierSchema,
});

export type GeneratedComponentSpecification = z.infer<
  typeof generatedComponentSpecificationSchema
>;
