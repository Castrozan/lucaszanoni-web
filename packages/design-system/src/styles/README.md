# Platform styling

Colour is declared once, in the theme palettes in TypeScript, and reaches CSS by exactly one route: `ThemeProvider` writes the palette onto the document root as `--ls-color-*` properties. The token bridge maps those onto Tailwind's `--color-*` theme tokens, so utility classes like `bg-surface` and `text-muted-foreground` resolve to the palette. A component that hardcodes a hex has forked the palette; use the utility class, or the token, and add a palette field if none fits.

Importing the bridge is how an app joins the design system: it pulls in Tailwind, the token mapping and the shared base layer together.

## Highlight pseudo-elements resolve tokens at the root only

Browsers resolve `var()` inside `::selection` and the `::highlight` family against the **document root**, never against the element the highlight sits on. A token defined on a wrapper element is invisible there: the declaration is invalid at computed-value time, so the colour silently falls back to transparent or to the operating system default. This is why the theme lands on the document root rather than on the provider's own element, and any future token a highlight rule needs must arrive the same way.

`::selection` also ignores the `background` shorthand. Declare `background-color`.

## One rule, many apps

The selection rule lives in its own stylesheet so it is stated once. The bridge imports it for every app built on the design system, and apps outside the bridge import it through the package export. A second `::selection` rule anywhere forks it; extend the shared one instead.

That rule keys off the `--color-primary` and `--color-primary-foreground` pair rather than the palette properties directly, because that pair is the one contract every app honours, including the ones that declare their own Tailwind theme and never see `--ls-color-*`. Shared rules meant for every app should key off tokens with that reach.

Any stylesheet an app outside this package needs must be listed in the package exports; a relative path only works for apps that can reach across the workspace.

## Verifying colour work

Verify rendered colour on the deployed origin or in a `data:` URL. A page-recolouring browser extension may be active on localhost while excluded from the production domain, which makes local before-and-after comparisons of colour meaningless without telling you.
