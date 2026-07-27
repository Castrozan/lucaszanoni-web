# Status bar

The bar mimics tmux: a session label on the left, numbered windows beside it, and a leader chord to reach them. Window numbers are positional, so `Leader <n>` activates the nth entry of the model and nothing else decides the numbering. Only the first nine windows get a chord.

## What goes in it

The bar renders a `StatusBarModel` and knows nothing about routes, pages or sections. There are two ways to supply one.

By default it derives the model from the route registry in `@platform/config`. A session is a top-level mount path and its windows are the routes mounted beneath it, so **a new micro-frontend appears in the bar by being registered, not by editing anything here**. A session that needs a specific window order, or windows that are not their own routes, declares them explicitly in the platform sessions source; that declaration is the only place ordering is decided.

Passing a `model` overrides that derivation entirely. This is how a page puts non-route things in the bar: the landing page numbers its scroll sections, and `AppStatusBar` appends an About window to the derived model. Prefer extending the derived model over replacing it, so registry-driven entries keep working.

Mount the bar wherever its model is decided. An app whose bar is the same everywhere mounts one at its root; an app whose pages need different bars mounts one per page and lets the route table decide which appears, including for unmatched paths. The failure to avoid is a single shared bar that inspects the path itself, because that is a second router that can disagree with the real one.

## Window kinds

A `link` window navigates; an `action` window runs a callback. Activating a link that is already active is a no-op, but activating an active action still runs it. That asymmetry is deliberate: for an action, active means a panel is open, and re-selecting it has to be able to close it.

## Keybinds

Chords are registered by the bar only when asked, and exactly one bar per page may do it. The keybind registry is keyed by action id, so a second bar does not conflict loudly: it silently replaces the first bar's chords, and whichever bar unmounts first takes them away from the survivor. `AppStatusBar` opts out entirely: the Next micro-frontends do not load the design system's Tailwind theme, so the keybind help overlay would render unstyled there. Consequently the bar hides the leader hint wherever no registry is mounted, rather than advertising chords nothing is listening for.

## Layout and the About panel

The bar publishes its height as a custom property on the document root so page layouts can subtract it. Anything sized against the viewport should read that property rather than repeating the number.

The About panel is fed entirely by the app's route registry entry, so an app documents itself by what it declares there. Nothing about a specific app belongs in the panel.
