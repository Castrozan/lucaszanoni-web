import { KeybindNavAction } from "./KeybindNavAction";
import { buildKeybindNavigationActions } from "./keybindNavigationActionList";

export function KeybindNavigationActions() {
  return (
    <>
      {buildKeybindNavigationActions().map((action) => (
        <KeybindNavAction key={action.id} action={action} />
      ))}
    </>
  );
}
