const commandEncoder = new TextEncoder();

export function encodeSessionSwitchCommand(key: string): Uint8Array {
  return commandEncoder.encode(`/session ${key.trim()}\r`);
}

export function encodeSessionListCommand(): Uint8Array {
  return commandEncoder.encode("/sessions\r");
}
