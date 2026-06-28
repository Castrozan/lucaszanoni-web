export interface KeyChord {
  readonly key: string;
  readonly mod: boolean;
  readonly ctrl: boolean;
  readonly meta: boolean;
  readonly shift: boolean;
  readonly alt: boolean;
}

const MODIFIER_EVENT_KEYS = new Set(["control", "shift", "alt", "meta"]);

export function chordFromKeyboardEvent(event: KeyboardEvent): KeyChord | null {
  const key = event.key.toLowerCase();
  if (MODIFIER_EVENT_KEYS.has(key)) {
    return null;
  }
  return {
    key,
    mod: false,
    ctrl: event.ctrlKey,
    meta: event.metaKey,
    shift: event.shiftKey,
    alt: event.altKey,
  };
}

export function parseChordToken(token: string): KeyChord {
  const parts = token.split("+").filter((part) => part.length > 0);
  const rawKey = parts[parts.length - 1] ?? token;
  const modifiers = parts.slice(0, -1).map((part) => part.toLowerCase());
  return {
    key: rawKey.toLowerCase(),
    mod: modifiers.includes("mod"),
    ctrl: modifiers.includes("ctrl") || modifiers.includes("control"),
    meta: modifiers.includes("meta") || modifiers.includes("cmd"),
    shift: modifiers.includes("shift"),
    alt: modifiers.includes("alt") || modifiers.includes("option"),
  };
}

export function eventChordMatchesBindingChord(
  eventChord: KeyChord,
  bindingChord: KeyChord,
): boolean {
  if (eventChord.key !== bindingChord.key) {
    return false;
  }
  const primaryModifierPressed = eventChord.ctrl || eventChord.meta;
  if (bindingChord.mod) {
    if (!primaryModifierPressed) {
      return false;
    }
  } else {
    if (bindingChord.ctrl !== eventChord.ctrl) {
      return false;
    }
    if (bindingChord.meta !== eventChord.meta) {
      return false;
    }
  }
  if (bindingChord.shift && !eventChord.shift) {
    return false;
  }
  if (bindingChord.alt !== eventChord.alt) {
    return false;
  }
  return true;
}
