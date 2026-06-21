export interface CockpitQuickAccessBookmark {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly href: string;
  readonly opensInNewTab: boolean;
}

export const cockpitQuickAccessBookmarks: readonly CockpitQuickAccessBookmark[] =
  [
    {
      id: "claude-usage",
      label: "Claude usage",
      description: "Live token usage and cost across machines.",
      href: "/engineering/dotfiles/claude/usage/",
      opensInNewTab: false,
    },
    {
      id: "reports",
      label: "Reports",
      description: "Generated dotfiles reports hub.",
      href: "/engineering/dotfiles/reports/",
      opensInNewTab: false,
    },
    {
      id: "public-site",
      label: "Public site",
      description: "The public lucaszanoni.com landing.",
      href: "/",
      opensInNewTab: false,
    },
    {
      id: "github-profile",
      label: "GitHub",
      description: "github.com/Castrozan",
      href: "https://github.com/Castrozan",
      opensInNewTab: true,
    },
    {
      id: "repo-source",
      label: "Repo source",
      description: "This monorepo on GitHub.",
      href: "https://github.com/Castrozan/lucaszanoni-web",
      opensInNewTab: true,
    },
  ];
