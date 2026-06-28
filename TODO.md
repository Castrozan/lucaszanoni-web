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

The keybind engine (`packages/design-system/src/keybinds`) ships the registry, a configurable leader
(default Ctrl+B) with full multi-key sequences, and localStorage overrides, mounted in every app via
`KeybindProvider`. Remaining:

- Migrate the command palette's own `Mod+K` / `/` listener onto the engine via `useKeybind` (currently
  the palette keeps its own window listener; only the `Leader p` open binding goes through the engine).
- Override-editing UI: a settings surface to rebind actions and the leader (storage API exists:
  `saveKeybindOverride` / `saveLeaderBinding`); today overrides only apply if written to localStorage
  directly.
- Discoverable help overlay (`?`) listing the active bindings.
- Register cross-app navigation and per-app actions through the engine so the registry is the full
  source of truth.

## Infra

- Static-spa provenance SHA is wired via the `ATRIUM_BUILD_SHA` docker build-arg; keep it flowing.
