const MODIFIER_EVENT_KEYS = new Set(["control", "shift", "alt", "meta"]);

export function buildBindingTokenFromEvent(
  event: Pick<
    KeyboardEvent,
    "key" | "ctrlKey" | "metaKey" | "shiftKey" | "altKey"
  >,
): string | null {
  const key = event.key.toLowerCase();
  if (MODIFIER_EVENT_KEYS.has(key)) {
    return null;
  }
  const modifiers: string[] = [];
  if (event.ctrlKey) {
    modifiers.push("Control");
  }
  if (event.metaKey) {
    modifiers.push("Meta");
  }
  if (event.shiftKey) {
    modifiers.push("Shift");
  }
  if (event.altKey) {
    modifiers.push("Alt");
  }
  return [...modifiers, key].join("+");
}

export function appendCapturedToken(
  capturedTokens: readonly string[],
  token: string,
): string[] {
  return [...capturedTokens, token];
}

export function capturedTokensToBinding(
  capturedTokens: readonly string[],
): string {
  return capturedTokens.join(" ");
}
