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

## Distribution

`build_single_file_launcher.py` inlines the bridge, the stdlib WebSocket server, the entry, and the vendored assets into one dependency-free `dist/local-cockpit.py`. That bundle is served by the deployed cockpit SPA as a static asset at `https://lucaszanoni.com/cockpit/local-cockpit.py`, so the install is a single:

```bash
curl -fsSL https://lucaszanoni.com/cockpit/local-cockpit.py | python3 -
```

The served copy lives at `apps/cockpit/public/local-cockpit.py` and is committed, so it can go stale: it is a generated artifact, not a source of truth. Whenever the bridge scripts or any launcher module change, regenerate and restage it:

```bash
./regenerate-and-stage-served-bundle.sh
```

That rebuilds `dist/local-cockpit.py` and copies it over `apps/cockpit/public/local-cockpit.py` for you to commit.
