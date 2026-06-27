import type { ReactNode } from "react";

function Keycap({ children }: { readonly children: ReactNode }) {
  return (
    <span className="inline-flex min-w-[1.4em] items-center justify-center border border-border bg-surface-raised px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
      {children}
    </span>
  );
}

interface RoadmapHint {
  readonly id: string;
  readonly label: string;
  readonly preview: ReactNode;
}

const roadmapHints: readonly RoadmapHint[] = [
  {
    id: "keyboard-navigation",
    label: "Keyboard navigation",
    preview: (
      <div className="flex items-center gap-1.5">
        <Keycap>j</Keycap>
        <Keycap>k</Keycap>
        <Keycap>g</Keycap>
        <Keycap>g</Keycap>
        <span className="ml-1 font-mono text-[12px] text-text-faint">
          vim-style nav
        </span>
      </div>
    ),
  },
  {
    id: "theming",
    label: "Theming",
    preview: (
      <div className="flex items-center gap-2">
        <span className="h-4 w-4 border border-border bg-background" />
        <span className="h-4 w-4 border border-border bg-primary" />
        <span
          className="h-4 w-4 border border-border"
          style={{ backgroundColor: "#F5F5F0" }}
        />
        <span className="ml-1 font-mono text-[12px] text-text-faint">
          themeable
        </span>
      </div>
    ),
  },
];

export function RoadmapHintStrip() {
  return (
    <section id="roadmap" className="border-t border-border py-20">
      <div className="mb-10 flex items-end justify-between">
        <h2 className="m-0 font-grotesk text-[clamp(28px,6vw,64px)] font-bold tracking-[-0.5px] text-foreground">
          ON THE ROADMAP
        </h2>
        <span className="font-mono text-[11px] uppercase tracking-[2px] text-text-faint">
          PREVIEW // NOT YET WIRED
        </span>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {roadmapHints.map((hint) => (
          <div
            key={hint.id}
            aria-disabled="true"
            tabIndex={-1}
            className="flex flex-col gap-4 border border-border bg-surface p-5 opacity-90"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[13px] uppercase tracking-[1.5px] text-foreground">
                {hint.label}
              </span>
              <span className="font-mono text-[10px] tracking-[2px] text-text-faint">
                SOON
              </span>
            </div>
            <div className="pointer-events-none select-none">
              {hint.preview}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
