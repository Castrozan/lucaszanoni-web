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

## Infra

- Static-spa provenance SHA is wired via the `ATRIUM_BUILD_SHA` docker build-arg; keep it flowing.
