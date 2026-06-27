# Keyboard-Driven Navigation Architecture for atrium

## Thesis

The atrium shell is already a multiplexer: a single long-lived React SPA at `/` that owns the `app-registry.json` registry and renders exactly one mounted micro-frontend into the viewport while keeping the rest addressable by `mountPath`. We make atrium fully keyboard-driven by treating the shell as a tmux server layered over that registry, with a shell-level keyboard engine that owns a global leader chord, a customizable declarative keymap stored registry-adjacent, a which-key popup and a command palette for discoverability, and a Vimium-style hint mode for "click anything." The single load-bearing constraint that shapes every decision is the origin boundary: same-origin path-prefix apps share the shell's `window` and are fully drivable from one shell-resident engine, while cross-origin subdomain apps are reachable only by top-level navigation or a cooperative `postMessage` contract and must degrade gracefully when that contract is absent.

## Recommended stack

**tinykeys (chord + leader engine) + cmdk (headless command palette) + a ~100-line homegrown hint mode, with the keymap loaded from a registry-adjacent config and re-instantiated per frame, cross-origin frames bridged by a `postMessage` chord bus.** One-line why: tinykeys is the only candidate that is simultaneously framework-agnostic (the identical engine drops into every micro-frontend regardless of stack), ~1 KB, has native leader/prefix sequences and a trivially rebindable plain-object keymap, and exposes the `target`/`capture`/`ignore` control the cross-origin-iframe reality forces on you, while cmdk supplies the accessible ARIA combobox discovery UI and a thin homegrown layer covers click-any-element, none of which any single library delivers at once.

The engine layer and the palette layer are deliberately separate: the engine binds keys to actions, the palette discovers actions and teaches their bindings inline. Do not conflate them. Rejected alternatives, with the disqualifier: `react-hotkeys-hook` (React-coupled, so it cannot be the shared engine across non-React frames), `@github/hotkey` (attribute-driven binding fights a config-driven user-rebind UI), `mousetrap` (unmaintained since 2020, leak-prone unbind in SPAs), `kbar` (perpetual `0.1.0-beta`, bundles its own binder we do not want), `ninja-keys` (dead since 2022, shadow-DOM styling friction). No maintained npm hint-mode library exists; Vimium and vimium-c are GPL browser extensions, not embeddable libraries, so hint mode is built in-app referencing the philc/vimium algorithm.

## tmux to atrium model

The shell is the server. Everything below is shell-owned client state persisted to `localStorage` and reflected into the URL; no micro-frontend needs to know it exists.

| tmux                              | atrium concept                                                                          | justification                                                                                                                                                               |
| --------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **server**                        | the shell SPA instance, one per browser profile                                         | single owner of `appRegistry` and the viewport; survives all navigation                                                                                                     |
| **session**                       | a named, persisted **workspace**: ordered windows + layout + focus                      | a saved working set you detach from (close the tab) and reattach to (reopen, rehydrate from `localStorage`); multiple sessions like `work`, `dotfiles`, `db-ops`            |
| **window**                        | a **tab bound to one registry entry** booted at a mount-relative path                   | the full-viewport unit cycled with `prefix n`/`p`; the window's "command" is the micro-frontend id plus its boot path                                                       |
| **pane**                          | a **split inside a window**, each hosting one app-at-a-path in an iframe                | a CSS-grid cell with its own iframe; panes may host different apps or the same app at different routes                                                                      |
| **buffer (pane content)**         | a **route inside the active app**: `mountPath` + app-internal subpath                   | the one layer the shell does not fully own; addressable as `mountPath + subpath`, e.g. `/engineering/dotfiles/reports/2026-06/`, deep only when the app speaks the contract |
| **paste-buffer / yank-ring**      | a shell-owned **ring of yanked deep URLs**                                              | tmux's named-buffer clipboard ring mapped to captured deep links; `prefix ]` opens the top one in a new pane, no app contract needed                                        |
| **prefix / leader**               | a chord the shell grabs globally in the capture phase, default **`Ctrl-b`**, rebindable | the shell is the only frame that can reliably own a global key; it captures and stops propagation so the focused app never sees the leader                                  |
| **status line**                   | a persistent shell-rendered bar (top or bottom)                                         | the shell already renders chrome around apps in `AppShell.tsx`; the status line is that chrome made tmux-shaped, and it doubles as the mode indicator                       |
| **copy-mode**                     | a shell **overlay** that freezes the focused pane for scroll/find/select                | intercepts keys, scrolls and finds within the pane, yanks selection text or the pane URL into the ring; works fully only same-origin                                        |
| **quick-switch (`prefix s`/`w`)** | a **cmdk palette** seeded from the session/window/pane tree, fuzzy-filtered             | collapses sessions, windows and panes into one searchable tree, recency-seeded so revisiting costs zero keystrokes                                                          |

### The micro-frontend boundary

Draw a hard line. **Above the boundary, shell-authoritative, zero cooperation:** which session, which window, the pane grid, which pane is focused, and the leader sequences operating on these. The shell does all of this today with only `app-registry.json`, because picking an app and a mount path is just setting an iframe `src`. **At or below the boundary, needs a `postMessage` contract, degrades without it:** reading an app's current internal route (for deep yanks), driving an app to an internal route (to restore a deep buffer), and forwarding an unhandled leader up from a focused iframe. The minimal three-message contract: app to shell `{ type: "route-changed", path }` on every internal navigation; shell to app `{ type: "navigate", path }`; app to shell `{ type: "leader-passthrough", chord }` when the app did not consume the leader. An app implementing none of it still works fully as a window and pane; you only lose deep-link fidelity and boot it at its mount root. The `db` entry (private owner, `external-https`, `trusted: false`) and any external origin will never implement the contract, so contract-absent is the default the model assumes, not the exception.

## Keybinding system

### Declarative keymap, registry-adjacent

The keymap is data, not code, and it lives beside the app registry so it follows the same single-source-of-truth principle: a committed `keymap-registry.json` parsed and validated by a sibling `keymap-registry.ts` in `packages/config/src`, mirroring how `app-registry.json` is parsed by `app-registry.ts`. The default keymap ships in that JSON; a user's overrides are a sparse patch persisted per browser profile in `localStorage` (and, if cross-device sync is ever wanted, server-backed and gated by the same `accessModel` machinery, out of scope for v1). The shape, expressed against the same discriminated-union and `readonly` conventions as `app-registry-types.ts`:

```jsonc
{
  "leader": "Control+b",
  "leaderArmTimeoutMs": 1500,
  "bindings": [
    {
      "id": "window.next",
      "description": "Next window",
      "sequence": ["leader", "n"],
      "command": { "kind": "window-next" },
      "context": "global",
      "whichKeyGroup": "window",
    },
    {
      "id": "nav.goto.reports",
      "description": "Go to Reports",
      "sequence": ["g", "r"],
      "command": { "kind": "navigate-app", "appId": "reports" },
      "context": "global",
      "whichKeyGroup": "goto",
    },
    {
      "id": "hint.activate",
      "description": "Label clickable targets",
      "sequence": ["f"],
      "command": { "kind": "hint-mode" },
      "context": "same-origin-pane",
      "whichKeyGroup": "motion",
    },
  ],
}
```

Each binding carries a stable `id` (the override key), a human `description` (palette and which-key text), a `sequence` (an ordered list where the literal `"leader"` expands to the configured leader chord, enabling both leader chords and bare `g r`-style go-to sequences), a discriminated-union `command` the engine dispatches, a `context` that scopes where the binding is live, and a `whichKeyGroup` for grouping in the popup. Command kinds enumerate the action space, for example `navigate-app`, `window-next`, `window-prev`, `pane-split-right`, `pane-split-down`, `pane-focus-direction`, `pane-zoom`, `copy-mode`, `yank-url`, `paste-url`, `open-palette`, `open-which-key`, `hint-mode`. Contexts are at least `global`, `same-origin-pane`, and `in-input` so single-letter motions can be suppressed where they would clobber typing.

### Default leader and overrides

The default leader is `Control+b`, matching tmux muscle memory and avoiding the browser-reserved `Cmd`/`Ctrl` single-letter chords. A user overrides any binding by writing a sparse patch keyed by binding `id`: setting a new `sequence`, or `null` to disable. The patch is layered over the shipped default at load time, so a user who rebinds `window.next` to `["leader", "."]` carries only that one entry, and an unedited binding always tracks the shipped default. The leader itself is overridable via the top-level `leader` field, and the change re-instantiates the engine immediately (tinykeys is rebuilt from the merged map object).

### Conflict resolution

Conflicts are resolved at merge time and surfaced, never silently dropped. Two rules. First, **specificity by context**: a binding scoped to `same-origin-pane` or `in-input` shadows a `global` binding with the same `sequence` only while that context is active, so `f` can mean hint-mode globally yet pass through as a literal character while an input is focused. Second, **last-writer-wins within a context**, where a user patch is always the last writer over the shipped default. When two bindings collide in the same context at the same specificity after merge, the validator (in `keymap-registry.ts`, the same place `app-registry.ts` raises `AppRegistryValidationError`) reports the colliding `id`s and the which-key popup flags the live winner, rather than letting one shadow the other invisibly. A user remapping onto an occupied sequence is shown the displaced binding before the patch is saved.

### Discoverability

Two surfaces, always. The **which-key popup** appears after the leader is armed (the status line flips color, à la tmux's message style) and lists the next valid keys grouped by `whichKeyGroup`, so the leader stops being invisible the way raw tmux and raw Vimium are. The **command palette** (cmdk, opened with its own binding, conventionally `Cmd/Ctrl+k`) fuzzy-searches every binding's `description`, seeds with recently-visited windows and panes before any keystroke, and renders each action's current `sequence` inline on the right so the slow path teaches the fast path and the user graduates off the palette. A `?` binding dumps the bindings live in the current context, the GitHub affordance, answering "what can I press here" against the merged keymap rather than a static sheet.

## Panes and splits across the origin boundary

A pane is a CSS-grid cell hosting one iframe pointed at a registry entry's `mountPath` plus an optional subpath. The grid, the focus, the layout presets (even-horizontal, even-vertical, main-vertical, tiled) and the zoom are pure shell CSS state and work identically regardless of what the pane contains. The split is where the origin boundary bites.

- **Same-origin path-prefix panes** (`shell`, `usage-dashboard`, `reports`, and `db` which is path-prefix at `/db/` though externally originated) share the `lucaszanoni.com` origin. The shell engine can move focus into the iframe's document, run hint mode over its DOM, drive copy-mode scroll and find, and read the live route for deep yanks. These are first-class, fully keyboard-driven panes.
- **Cross-origin subdomain panes** (`servingLocation: { kind: "subdomain" }`, wired in `app-registry-types.ts` and the edge worker but currently unused in `app-registry.json`) live at `label.lucaszanoni.com`, a different origin. The Same-Origin Policy blocks the shell from touching `iframe.contentWindow.document`, moving focus inside, or reading the internal route. The shell can only set the iframe `src` (boot at mount root), post the three-message contract and hope the app listens, or trigger a top-level navigation to the subdomain URL and hand off entirely.

The fallback for cross-origin is a handoff, not a continuous controller. A cross-origin pane participates fully as a window and pane at the grid level; it boots at its mount root, shows a status-line glyph marking it boot-path-only, and within it the destination app's own copy of the shared engine takes over focus and hint mode. Cross-section keyboard nav into a subdomain app is therefore "navigate there, the destination engine takes over," never one shell-resident layer reaching across the boundary. Cut from v1: pane synchronization (`synchronize-panes`), since it implies driving keystrokes into iframes the shell may neither own nor reach.

## Focus management and accessibility

Never trap assistive-tech users. This is a WCAG 2.1.4 (Level A) requirement, not a nicety: single-character shortcuts must be turn-off-able, remappable to include a modifier, or active only on focus. Concretely:

- **Suspend single-key bindings in inputs.** When focus lands in an `<input>`, `<textarea>`, `[contenteditable]`, or a focused iframe, the engine switches to the `in-input` context and passes keystrokes through (tinykeys' `ignore` hook plus an explicit contenteditable and iframe-focus check, not just tag-name matching). Always provide a clean, visible exit back to command mode, the documented Vimium failure being "no reliable way back."
- **Do not clobber the host.** Never intercept browser-reserved combos (`Cmd/Ctrl+T`/`W`/`L`/`R`, find). Keep `Escape` pass-through so apps can close their own dialogs, and offer a pass-through chord for the rare case the engine must yield a key.
- **Expose and disable.** Surface bindings to assistive tech via `aria-keyshortcuts` on the elements they act on so screen readers announce them, and avoid colliding with screen-reader and voice-control quick-nav keys by leaning on the leader and `g`-prefix namespaces before exhausting bare letters. Ship a **global off toggle** that disables the whole engine (a setting and a binding), so a user on assistive tech can turn it off entirely.
- **Respect `prefers-reduced-motion`.** Pane zoom, layout transitions, the which-key reveal, and hint-overlay animation collapse to instant state changes when the media query matches.

## Incremental adoption plan

Every slice is flag-gated behind a shell-level feature flag, reversible by flipping the flag, and ordered by ascending risk. Earlier slices ship value before any iframe or cross-origin complexity is touched.

1. **Engine + keymap config, navigation only.** Add tinykeys and the `keymap-registry.json` / `keymap-registry.ts` pair. Mount the engine as a shell-level provider in `AppShell.tsx`, mirroring the existing `useTheme` provider. Bind `g`-prefix go-to sequences that set `window.location` to a registry `mountPath`, driving the same anchors the nav already renders. Zero iframes, zero new origins, lowest risk.
2. **Command palette.** Add cmdk, seeded from `CROSS_SECTION_NAVIGATION_ROUTES` and `MICRO_FRONTEND_ROUTES`, showing each binding inline. Pure additive discovery; flag off restores today's behavior exactly.
3. **Which-key popup + status line + leader.** Render the armed-leader indicator and the grouped next-key popup, and stand up the status line as the mode surface. Still navigation-only, no panes.
4. **User overrides + conflict surfacing.** Persist the sparse override patch to `localStorage`, layer it over the default, and wire the validator's collision reporting into a small settings surface and the which-key flag.
5. **Hint mode, same-origin only.** The ~100-line overlay over the shell document and same-origin panes. Gated to `same-origin-pane` context; cross-origin panes simply do not offer it.
6. **Single-window panes/splits.** Introduce the CSS-grid pane model and layout presets within one window, same-origin iframes first. Copy-mode and yank-ring ride along here.
7. **Sessions, persistence, and the `postMessage` contract.** Named workspaces rehydrated from `localStorage`, the URL focus encoding, and the three-message contract for cooperating apps. Cross-origin panes land here as boot-path-only, contract-optional participants.

## Open decisions

These are owner-only or taste calls; each is flagged rather than silently resolved.

- **Default leader key.** Proposed `Control+b` for tmux fidelity. Alternatives: `Control+space` (no tmux clash, awkward on some layouts) or a bare `` ` `` backtick leader (fast, collides with code input). Owner call; the schema makes it a one-field change regardless.
- **Ship hint mode at all.** It is the highest-value "click anything" primitive but also the heaviest same-origin-only feature and the one most likely to clobber input focus. Decision: ship it (slice 5) or stop at palette + go-to sequences. Owner call on scope.
- **Panes as iframes vs route-level splits.** This document assumes iframe-per-pane, which is the only model that works for cross-origin and for apps the shell does not bundle. The alternative, route-level splits rendering multiple same-origin apps as mounted React subtrees, is lighter and fully drivable but cannot host cross-origin or external apps (`db`, future subdomains) at all. Owner call; a hybrid (route-level for same-origin, iframe for cross-origin) is possible but doubles the pane implementation.
- **Cross-device session sync.** v1 is per-browser-profile `localStorage`, matching tmux's per-machine server. Server-backed sessions gated by `accessModel` are deferred; decide if and when the cross-device working set is worth the backend.
- **Keymap override storage location.** `localStorage` sparse patch in v1. Whether overrides ever move server-side (and thus become a private-environment synced resource, owner or shared audience) is an owner call tied to the cross-device decision above.
