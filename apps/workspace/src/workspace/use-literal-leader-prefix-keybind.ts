import {
  controlByteForLeaderBinding,
  useKeybind,
  useKeybindRegistry,
} from "@platform/design-system";

export function useLiteralLeaderPrefixKeybind(
  sendOwnerKeystrokes: (bytes: Uint8Array) => void,
): void {
  const registry = useKeybindRegistry();
  const controlByte = registry
    ? controlByteForLeaderBinding(registry.leader)
    : null;

  useKeybind({
    id: "workspace.terminal.literal-leader-prefix",
    label: "Send the leader chord to the terminal",
    defaultBinding: "Leader Leader",
    run: () => {
      if (controlByte === null) {
        return;
      }
      sendOwnerKeystrokes(new Uint8Array([controlByte]));
    },
  });
}
