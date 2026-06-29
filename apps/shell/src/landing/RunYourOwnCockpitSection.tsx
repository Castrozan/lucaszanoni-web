import { DriveYourOwnMachineCallToAction } from "@platform/design-system";

export function RunYourOwnCockpitSection() {
  return (
    <section id="run-your-own-cockpit" className="border-t border-border py-20">
      <div className="mb-10 flex items-end justify-between gap-6">
        <div className="flex flex-col gap-3">
          <h2 className="m-0 font-grotesk text-[clamp(28px,6vw,64px)] font-bold tracking-[-0.5px] text-foreground">
            RUN YOUR OWN COCKPIT
          </h2>
          <p className="m-0 max-w-[40rem] font-mono text-[13px] leading-[1.6] tracking-[0.5px] text-muted-foreground">
            The cockpit that fronts this platform runs on your machine too, over
            your own tmux. One line, no install, source in the open.
          </p>
        </div>
        <span className="shrink-0 font-mono text-[11px] uppercase tracking-[2px] text-text-faint">
          OPEN TOOL
        </span>
      </div>
      <DriveYourOwnMachineCallToAction />
    </section>
  );
}
