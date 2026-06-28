export interface KeybindActionShape {
  readonly id: string;
  readonly label: string;
  readonly defaultBinding: string;
}

export interface KeybindBindingView {
  readonly id: string;
  readonly label: string;
  readonly defaultBinding: string;
  readonly currentBinding: string;
  readonly isOverridden: boolean;
}

export function buildKeybindBindingViews(
  registrations: readonly KeybindActionShape[],
  overrides: Record<string, string>,
): KeybindBindingView[] {
  return registrations.map((registration) => {
    const override = overrides[registration.id];
    return {
      id: registration.id,
      label: registration.label,
      defaultBinding: registration.defaultBinding,
      currentBinding: override ?? registration.defaultBinding,
      isOverridden: override !== undefined,
    };
  });
}
