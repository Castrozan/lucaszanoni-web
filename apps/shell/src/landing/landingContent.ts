export interface HeroCallToAction {
  readonly label: string;
  readonly href: string;
  readonly external?: boolean;
}

export interface HeroContent {
  readonly kicker: string;
  readonly staticHeadlineLine: string;
  readonly dynamicHeadlineLine: string;
  readonly subhead: string;
  readonly primaryCallToAction: HeroCallToAction;
  readonly secondaryCallToAction: HeroCallToAction;
  readonly deploymentTagline: string;
}

export interface TerminalLine {
  readonly kind: "command" | "output";
  readonly text: string;
}

export interface TerminalContent {
  readonly promptLabel: string;
  readonly lines: readonly TerminalLine[];
}

export interface PlatformFeature {
  readonly label: string;
  readonly body: string;
  readonly accented: boolean;
}

export const heroContent: HeroContent = {
  kicker: "[ATRIUM] // ONE EDGE, MANY APPS",
  staticHeadlineLine: "ONE EDGE.",
  dynamicHeadlineLine: "MANY APPS.",
  subhead:
    "Engineering notes and live operational dashboards, served as independently deployed micro-frontends behind a single edge.",
  primaryCallToAction: { label: "EXPLORE", href: "#sections" },
  secondaryCallToAction: {
    label: "VIEW SOURCE >",
    href: "https://github.com/Castrozan/lucaszanoni-web",
    external: true,
  },
  deploymentTagline: "STATICALLY DEPLOYED // CLOUDFLARE EDGE // OPEN BUILD",
};

export const terminalContent: TerminalContent = {
  promptLabel: "~/lucaszanoni — zsh",
  lines: [
    { kind: "command", text: "$ curl lucaszanoni.com/engineering/reports/" },
    { kind: "output", text: "→ 200 OK  served from cloudflare edge" },
    { kind: "output", text: "→ micro-frontend: reports  build: static-spa" },
    { kind: "command", text: "$ open /engineering/dotfiles/claude/usage/" },
    { kind: "output", text: "→ live operational dashboard mounted" },
  ],
};

export const platformFeatures: readonly PlatformFeature[] = [
  {
    label: "SINGLE EDGE",
    body: "One Cloudflare edge fronts many independently deployed micro-frontends. Ship a section without redeploying the rest.",
    accented: false,
  },
  {
    label: "STATIC-FIRST",
    body: "Static-SPA build profile. No server bloat, no cold starts, just fingerprinted assets served from the edge.",
    accented: true,
  },
  {
    label: "DARK-NATIVE",
    body: "Built dark for the terminal generation. Hard edges, mono labels, a yellow block cursor that means business.",
    accented: false,
  },
];
