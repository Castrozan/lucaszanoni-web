import { DriveYourOwnMachineCallToAction } from "@platform/design-system";
import { COCKPIT_SECTION_ID } from "./landingSections";

interface CockpitFacet {
  readonly label: string;
  readonly body: string;
}

const cockpitFacets: readonly CockpitFacet[] = [
  {
    label: "WHAT IT IS",
    body: "A browser front end for the terminal sessions running on my machines. Sessions, windows, panes and live output, mirrored one to one from tmux into the same numbered status bar you are using on this page.",
  },
  {
    label: "WHAT IT IS FOR",
    body: "Work that outlives the moment you started it. Agents that run for hours, long builds, servers left up overnight. Kick it off at the desk, then read it, steer it and restart it from whatever screen is nearest.",
  },
  {
    label: "HOW TO USE IT",
    body: "With the leader key. The switcher lists your sessions, the numbers move between windows, and anything you type lands in the focused pane. If you know tmux, there is nothing new to learn.",
  },
];

export function CockpitSection() {
  return (
    <section id={COCKPIT_SECTION_ID} className="border-t border-border py-20">
      <div className="mb-10 flex items-end justify-between gap-6">
        <div className="flex flex-col gap-3">
          <h2 className="m-0 font-grotesk text-[clamp(28px,6vw,64px)] font-bold tracking-[-0.5px] text-foreground">
            THE COCKPIT
          </h2>
          <p className="m-0 max-w-[44rem] font-mono text-[13px] leading-[1.6] tracking-[0.5px] text-muted-foreground">
            The cockpit is how I drive my machines when I am not sitting at
            them. It is the control room of this platform, and the same one line
            puts it on your own machine.
          </p>
        </div>
        <span className="shrink-0 font-mono text-[11px] uppercase tracking-[2px] text-text-faint">
          OPEN TOOL
        </span>
      </div>
      <div className="mb-10 grid gap-6 md:grid-cols-3">
        {cockpitFacets.map((facet) => (
          <div
            key={facet.label}
            className="flex flex-col gap-4 border border-border bg-surface p-7"
          >
            <h3 className="m-0 font-grotesk text-[18px] font-bold tracking-[-0.2px] text-primary">
              {facet.label}
            </h3>
            <p className="m-0 font-mono text-[13px] leading-[1.6] tracking-[0.5px] text-muted-foreground">
              {facet.body}
            </p>
          </div>
        ))}
      </div>
      <DriveYourOwnMachineCallToAction />
    </section>
  );
}
