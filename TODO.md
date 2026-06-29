# TODO

Internal backlog for the platform. This lived as an on-page "ROADMAP" section on the public landing,
which no persona needs to read; it belongs here next to the code.

## Landing / shell

- Keyboard navigation across the landing and command palette.
- Theming (light mode is already defined in the design-system palette; wire a toggle).
- Live AI previews on the landing showcase: stream a real Gemini response inline instead of the canned
  sample. Needs an AI-budget decision and edge `frame-ancestors` for an embedded live frame.
- Public uptime artifact: publish a secret-free status signal the landing can surface.
- Preview-descriptor schema override for showcase entries (deferred until live-preview-mode exists).

## Keybinds

The keybind engine (`packages/design-system/src/keybinds`) is a full user-facing system, mounted in
every app via `KeybindProvider`: the registry is the single source of truth, with a configurable leader
(default Ctrl+B) and full multi-key sequences. The command palette runs entirely on the engine (`Mod+K`
toggles, `/` opens, `Leader p` opens; no parallel window listener). A help overlay (`?`) lists every live
binding, the leader, and conflicts; from its Edit mode any action and the leader rebind via key capture,
reset to default, and persist to localStorage (applied live, surviving reload). Cross-app navigation is
registered through the engine as leader-g sequences (`Leader g c` to Cockpit, etc.), so it is both
discoverable in the overlay and rebindable.

## Infra

- Static-spa provenance SHA is wired via the `ATRIUM_BUILD_SHA` docker build-arg; keep it flowing.

## Cockpit: bring-your-own local tmux (multi-user, no per-machine tunnel)

The cockpit today reaches a real machine through a Cloudflare tunnel per host (owner-only). A deployed
public page cannot reach a visitor's own machine directly, so this is the constraint we work around:

```
 BLOCKED:  Brave ──✗──► ws://127.0.0.1:8787 (kira localhost)
           Private Network Access: a public HTTPS page can't reach localhost
```

Workaround to build: let any visitor drive their OWN local tmux from the cockpit by running a one-liner
install script that launches a localhost cockpit against their local processes, the same way our cockpit
already works. Verbatim:

> the set up we have now require a cloudflare tunnel, but i want anyone to access the website and then be able to use our cockpit feature on their own local tmux (not my personal, their's local) this can be achieved by accessing the cockpti and then to connect the users are required to run a small one liner script like those to install apps on linux that would just launch a localhost version of the cockpit running the local processies like our own cockpit works
