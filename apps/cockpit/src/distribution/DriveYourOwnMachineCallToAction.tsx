import { useCallback, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@platform/design-system";

const LOCALHOST_COCKPIT_INSTALL_ONE_LINER =
  "curl -fsSL https://lucaszanoni.com/cockpit/local-cockpit.py | python3 -";

const COPIED_CONFIRMATION_RESET_MILLISECONDS = 2000;

export function DriveYourOwnMachineCallToAction() {
  const [hasCopiedOneLiner, setHasCopiedOneLiner] = useState(false);
  const copyInstallOneLinerToClipboard = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }
    await navigator.clipboard.writeText(LOCALHOST_COCKPIT_INSTALL_ONE_LINER);
    setHasCopiedOneLiner(true);
    window.setTimeout(
      () => setHasCopiedOneLiner(false),
      COPIED_CONFIRMATION_RESET_MILLISECONDS,
    );
  }, []);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Drive your own machine</CardTitle>
        <CardDescription>
          Run a local cockpit on your own machine over your own tmux. Opening
          the printed http://127.0.0.1 URL gives you the same session-list UI.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-md border border-border bg-surface px-4 py-3 font-mono text-[13px] text-foreground">
            {LOCALHOST_COCKPIT_INSTALL_ONE_LINER}
          </code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyInstallOneLinerToClipboard}
            className="shrink-0"
          >
            {hasCopiedOneLiner ? "Copied" : "Copy"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
