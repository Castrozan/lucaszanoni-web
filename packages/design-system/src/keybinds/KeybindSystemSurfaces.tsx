import { KeybindHelpOverlay } from "./KeybindHelpOverlay";
import { KeybindNavigationActions } from "./KeybindNavigationActions";

export function KeybindSystemSurfaces() {
  return (
    <>
      <KeybindNavigationActions />
      <KeybindHelpOverlay />
    </>
  );
}
