import type { SystemDocument } from "../system-document";

export const cockpitSignalPathDocument: SystemDocument = {
  id: "cockpit-signal-path",
  title: "How a keystroke reaches a machine",
  summary:
    "Every character you type in the cockpit terminal crosses these hops before a shell on one of your machines sees it, and the output comes back the same way.",
  body: {
    kind: "flow",
    label: "Signal path",
    stages: [
      {
        id: "browser",
        label: "This browser",
        detail:
          "The cockpit single page app, served as static files from Cloud Run under the site domain.",
      },
      {
        id: "access",
        label: "Cloudflare Access",
        detail:
          "An owner-only policy on the cockpit mount path. Nothing behind this hop is reachable by anyone else, which is what makes these pages private.",
      },
      {
        id: "tunnel",
        label: "Cloudflare Tunnel",
        detail:
          "One named tunnel per machine. The machine dials out, so no port is ever opened towards the internet.",
      },
      {
        id: "bridge",
        label: "Session bridge",
        detail:
          "A loopback service on the machine that checks the request origin and then speaks websocket to the page.",
      },
      {
        id: "multiplexer",
        label: "herdr",
        detail:
          "The multiplexer that owns every session and window on that machine, and answers with the list the status bar draws.",
      },
      {
        id: "window",
        label: "Agent window",
        detail:
          "The pane an agent or a shell is already running in. The cockpit attaches to it, it never spawns a second copy.",
      },
    ],
  },
};
