declare module "vitest" {
  interface ProvidedContext {
    selectionHighlightCss: string;
    tokenBridgeCss: string;
  }
}

export {};
