export class DynamicInterfaceError extends Error {
  constructor(
    message: string,
    readonly errorCode: string,
    readonly errorContext: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "DynamicInterfaceError";
  }
}

export class ComponentNotFoundInCatalogError extends DynamicInterfaceError {
  constructor(componentName: string) {
    super(
      `Component "${componentName}" is not registered in the catalog`,
      "COMPONENT_NOT_IN_CATALOG",
      { componentName },
    );
    this.name = "ComponentNotFoundInCatalogError";
  }
}

export class IntentClassificationFailedError extends DynamicInterfaceError {
  constructor(rawInput: string, reason: string) {
    super(
      `Failed to classify intent for input: ${reason}`,
      "INTENT_CLASSIFICATION_FAILED",
      { rawInput, reason },
    );
    this.name = "IntentClassificationFailedError";
  }
}

export class ToolOutputValidationFailedError extends DynamicInterfaceError {
  constructor(toolName: string, validationErrors: readonly string[]) {
    super(
      `Tool "${toolName}" produced invalid output`,
      "TOOL_OUTPUT_VALIDATION_FAILED",
      { toolName, validationErrors },
    );
    this.name = "ToolOutputValidationFailedError";
  }
}
