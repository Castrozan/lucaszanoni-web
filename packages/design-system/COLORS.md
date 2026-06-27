# Platform color tokens

Every color on the platform comes from one place: `src/theme/theme-tokens.ts` (`THEME_PALETTES`).
`paletteToCssVariables` emits each token as a `--ls-color-*` custom property, `ThemeProvider` sets those
on the root at runtime, and `src/styles/tailwind-token-bridge.css` maps them to Tailwind v4 `--color-*`
so apps consume them as utility classes (`bg-background`, `text-foreground`, `text-muted-foreground`,
`border-border`, …). Apps must use these tokens, never hardcoded hex.

## Tokens (dark / light)

| token | tailwind class examples | dark | light |
| --- | --- | --- | --- |
| background | `bg-background` | `#0A0A0A` | `#ffffff` |
| surface | `bg-muted` | `#111111` | `#f6f8fa` |
| surfaceRaised | `bg-surface-raised` | `#1A1A1A` | `#eaeef2` |
| surfaceTranslucent | overlays | `rgba(10,10,10,0.85)` | `rgba(246,248,250,0.82)` |
| border | `border-border` | `#2A2A2A` | `#d0d7de` |
| textPrimary | `text-foreground` | `#F5F5F0` | `#1f2328` |
| textMuted | `text-muted-foreground` | `#888888` | `#656d76` |
| textFaint | `text-text-faint` | `#757575` | `#8c959f` |
| accent | `text-primary` / `bg-primary` | `#FFD600` | `#0969da` |
| accentMuted | hover/pressed accent | `#E6C200` | `#0550ae` |
| accentSecondary | `text-accent-secondary` | `#FF6B35` | `#d4571f` |
| statusPositive | success | `#3FB950` | `#1A7F37` |
| statusCaution | warning | `#D29922` | `#9A6700` |
| statusNegative | error | `#F85149` | `#CF222E` |

## Contrast guidance (dark background `#0A0A0A`)

- `textPrimary` and `accent`: headings and primary actions, high contrast.
- `textMuted` (`#888888`, ~5:1): the tier for any text that must be read, including secondary and
  deployment metadata. Meets WCAG AA for normal text.
- `textFaint` (`#757575`, ~4.2:1): the dimmest tier, for decorative micro-labels and de-emphasized
  output. Do NOT use it for text a visitor needs to read in full; use `textMuted` instead.
