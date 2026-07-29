export interface SystemFlowStage {
  readonly id: string;
  readonly label: string;
  readonly detail: string;
}

export interface KeyBindingEntry {
  readonly binding: string;
  readonly action: string;
}

export interface PlatformSurface {
  readonly id: string;
  readonly label: string;
  readonly mountPath: string;
  readonly purpose: string;
  readonly isOwnerOnly: boolean;
}

export type SystemDocumentBody =
  | {
      readonly kind: "flow";
      readonly label: string;
      readonly stages: readonly SystemFlowStage[];
    }
  | {
      readonly kind: "key-bindings";
      readonly label: string;
      readonly entries: readonly KeyBindingEntry[];
    }
  | {
      readonly kind: "platform-surfaces";
      readonly label: string;
      readonly surfaces: readonly PlatformSurface[];
    };

export interface SystemDocument {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly body: SystemDocumentBody;
}
