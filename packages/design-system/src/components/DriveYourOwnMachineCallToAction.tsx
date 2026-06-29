import { useCallback, useState } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

const LOCALHOST_COCKPIT_INSTALL_ONE_LINER =
  "curl -fsSL https://lucaszanoni.com/cockpit/local-cockpit.py | python3 -";

const LOCALHOST_COCKPIT_SOURCE_INSPECTION_URL =
  "https://github.com/Castrozan/lucaszanoni-web/tree/main/local-cockpit";

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
          Run a local cockpit on your own machine over your own tmux. Open the
          printed http://127.0.0.1 URL for the same session-list UI. It binds
          127.0.0.1 only.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
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
        <a
          href={LOCALHOST_COCKPIT_SOURCE_INSPECTION_URL}
          target="_blank"
          rel="noreferrer"
          className="self-start font-mono text-[11px] uppercase tracking-[1.5px] text-text-faint no-underline transition-colors hover:text-foreground"
        >
          Inspect the source &#8599;
        </a>
      </CardContent>
    </Card>
  );
}
