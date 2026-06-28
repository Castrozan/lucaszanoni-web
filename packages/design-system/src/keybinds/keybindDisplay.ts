const MODIFIER_DISPLAY: Record<string, string> = {
  mod: "Mod",
  ctrl: "Ctrl",
  control: "Ctrl",
  meta: "Cmd",
  cmd: "Cmd",
  shift: "Shift",
  alt: "Alt",
  option: "Alt",
};

function formatChordToken(token: string): string {
  const parts = token.split("+").filter((part) => part.length > 0);
  if (parts.length === 0) {
    return token;
  }
  const key = parts[parts.length - 1];
  const formattedKey = key.length === 1 ? key.toUpperCase() : key;
  const modifiers = parts
    .slice(0, -1)
    .map((part) => MODIFIER_DISPLAY[part.toLowerCase()] ?? part);
  return [...modifiers, formattedKey].join("+");
}

export function formatBindingForDisplay(
  binding: string,
  leaderBinding: string,
): string {
  const tokens = binding.split(/\s+/).filter((token) => token.length > 0);
  const expanded = tokens.flatMap((token) =>
    token.toLowerCase() === "leader"
      ? leaderBinding.split(/\s+/).filter((part) => part.length > 0)
      : [token],
  );
  return expanded.map(formatChordToken).join(" then ");
}
