export type CockpitQuickAccessTarget =
  | { readonly kind: "cockpit-route"; readonly path: string }
  | { readonly kind: "same-tab-url"; readonly href: string }
  | { readonly kind: "new-tab-url"; readonly href: string };

export interface CockpitQuickAccessBookmark {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly target: CockpitQuickAccessTarget;
}

export const cockpitQuickAccessBookmarks: readonly CockpitQuickAccessBookmark[] =
  [
    {
      id: "terminal",
      label: "Terminal",
      description: "The agent terminal and your live sessions.",
      target: { kind: "cockpit-route", path: "/terminal" },
    },
    {
      id: "claude-usage",
      label: "Claude usage",
      description: "Live token usage and cost across machines.",
      target: {
        kind: "same-tab-url",
        href: "/engineering/dotfiles/claude/usage/",
      },
    },
    {
      id: "reports",
      label: "Reports",
      description: "Generated dotfiles reports hub.",
      target: {
        kind: "same-tab-url",
        href: "/engineering/dotfiles/reports/",
      },
    },
    {
      id: "public-site",
      label: "Public site",
      description: "The public lucaszanoni.com landing.",
      target: { kind: "same-tab-url", href: "/" },
    },
    {
      id: "github-profile",
      label: "GitHub",
      description: "github.com/Castrozan",
      target: { kind: "new-tab-url", href: "https://github.com/Castrozan" },
    },
    {
      id: "repo-source",
      label: "Repo source",
      description: "This monorepo on GitHub.",
      target: {
        kind: "new-tab-url",
        href: "https://github.com/Castrozan/lucaszanoni-web",
      },
    },
  ];
