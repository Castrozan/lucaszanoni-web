# Local cockpit

Drive your **own** machine's tmux from a browser, the same way the deployed cockpit drives the owner's machines, but with no account, no Cloudflare tunnel, and no server. You run one local process and open a localhost page.

## Why it has to run from localhost

The deployed cockpit at `https://lucaszanoni.com/cockpit/` cannot reach your machine. A public HTTPS page is blocked by browser Private Network Access from opening a WebSocket to `127.0.0.1`, and WebSockets have no preflight to opt in, so there is no way for the deployed page to talk to a bridge on your loopback. A locally-trusted TLS cert for `localhost` would still hit that wall and cannot be handed to everyone safely.

The fix is to move the page onto your machine. The launcher serves the terminal UI and the session-bridge on a single localhost port, so the page becomes `http://127.0.0.1:<port>` and the WebSocket it opens is same-origin and local. There is no cross-network request, no mixed content, and no certificate. The bridge attaches a PTY to your tmux and streams it to the page.

## Run it

Needs `python3` and the `websockets` package.

```bash
python3 launcher.py
# then open http://127.0.0.1:7682/
```

Environment overrides: `LOCAL_COCKPIT_PORT` (default `7682`), `LOCAL_COCKPIT_TMUX` (default `tmux`), `LOCAL_COCKPIT_SESSION` (default `cockpit-local`). The launcher binds to `127.0.0.1` only and attaches-or-creates the one tmux session, so it never exposes anything off your machine.

## Status

This is the proof that the localhost approach works: it renders a real tmux session in the browser over the same-origin local socket, which the deployed page cannot do. It is one session and a single dependency, not the finished feature.

Next increments: make it dependency-free (a stdlib-only WebSocket server) so the install is a single `curl … | python3 -`; reuse the full cockpit SPA so it lists and switches between your sessions instead of attaching one; and add a "drive your own machine" call to action on `/cockpit/` that hands out the one-liner.
