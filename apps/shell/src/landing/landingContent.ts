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

export interface FeaturePreview {
  readonly routeId: string;
  readonly intentExample: string;
  readonly sampleCaption: string;
  readonly sampleLines: readonly string[];
}

export const featurePreviews: readonly FeaturePreview[] = [
  {
    routeId: "dynamic-ia-interfaces",
    intentExample: "What's the weather in Tokyo?",
    sampleCaption: "Gemini selects a UI tool and the app renders it inline.",
    sampleLines: [
      "tool: displayWeatherForecast",
      "Tokyo · 19°C · Overcast",
      "humidity 59% · wind 19 km/h W",
    ],
  },
  {
    routeId: "dynamic-ia-canvas",
    intentExample: "A pricing card with three tiers",
    sampleCaption:
      "Gemini writes the component code; it renders on the canvas.",
    sampleLines: [
      "component: PricingCard",
      "Basic $19 · Pro $49 (recommended) · Enterprise $99",
      "rendered in a sandboxed iframe",
    ],
  },
];

export interface RoadmapCapability {
  readonly id: string;
  readonly label: string;
  readonly status: "shipped" | "planned";
}

export const roadmapCapabilities: readonly RoadmapCapability[] = [
  { id: "command-palette", label: "Command palette", status: "shipped" },
  {
    id: "registry-directory",
    label: "Registry-driven directory",
    status: "shipped",
  },
  { id: "edge-signal", label: "Live edge signal", status: "shipped" },
  { id: "feature-previews", label: "Feature previews", status: "shipped" },
  {
    id: "engineering-table",
    label: "Self-rendering registry table",
    status: "shipped",
  },
  {
    id: "keyboard-navigation",
    label: "Keyboard navigation",
    status: "planned",
  },
  { id: "theming", label: "Theming", status: "planned" },
  { id: "live-ai-previews", label: "Live AI previews", status: "planned" },
];

export interface EngineeringNarrativeCard {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly evidenceLabel: string;
  readonly evidenceHref: string;
}

export interface EngineeringContent {
  readonly heading: string;
  readonly subtitle: string;
  readonly registryTableCaption: string;
  readonly narrativeCards: readonly EngineeringNarrativeCard[];
}

const REPOSITORY_FILE_BASE_URL =
  "https://github.com/Castrozan/lucaszanoni-web/blob/main";

export const engineeringContent: EngineeringContent = {
  heading: "HOW THIS SITE BUILDS ITSELF",
  subtitle:
    "The same app-registry.json that drives Terraform, the deploy matrix, and the edge worker also assembles this page. Every claim below links to the code.",
  registryTableCaption:
    "Rendered live from packages/config/src/app-registry.json — the platform's single source of truth.",
  narrativeCards: [
    {
      id: "edge-worker",
      title: "ONE DATA-DRIVEN EDGE WORKER",
      body: "A single Cloudflare Worker routes every app from an EDGE_ROUTES binding, with no per-app code and no hardcoded routes.",
      evidenceLabel: "edge-router-worker.mjs",
      evidenceHref: `${REPOSITORY_FILE_BASE_URL}/infra/modules/cloudflare-edge/edge-router-worker.mjs`,
    },
    {
      id: "scale-to-zero",
      title: "SCALE-TO-ZERO CLOUD RUN",
      body: "Every in-repo service runs with min_instance_count set to zero, so an idle app costs nothing to keep online.",
      evidenceLabel: "serverless-cloud-run-app/main.tf",
      evidenceHref: `${REPOSITORY_FILE_BASE_URL}/infra/modules/serverless-cloud-run-app/main.tf`,
    },
    {
      id: "keyless-cd",
      title: "KEYLESS CD VIA OIDC",
      body: "Deploys authenticate to Google Cloud through Workload Identity Federation, so no service-account key is stored.",
      evidenceLabel: "deploy-infrastructure.yml",
      evidenceHref: `${REPOSITORY_FILE_BASE_URL}/.github/workflows/deploy-infrastructure.yml`,
    },
    {
      id: "registry-ssot",
      title: "REGISTRY AS SINGLE SOURCE OF TRUTH",
      body: "One JSON array defines every app; routing, infrastructure, the deploy matrix, access policy, and this page all derive from it.",
      evidenceLabel: "app-registry.json",
      evidenceHref: `${REPOSITORY_FILE_BASE_URL}/packages/config/src/app-registry.json`,
    },
    {
      id: "ai-core",
      title: "FREE GEMINI AI CORE",
      body: "The dynamic apps generate UI with Google Gemini 2.5 Flash via the Vercel AI SDK, server-side behind the edge.",
      evidenceLabel: "generateComponentAction.ts",
      evidenceHref: `${REPOSITORY_FILE_BASE_URL}/apps/dynamic-ia-canvas/src/modules/generation/generateComponentAction.ts`,
    },
  ],
};
