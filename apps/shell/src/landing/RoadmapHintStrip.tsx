import { roadmapCapabilities } from "./landingContent";

export function RoadmapHintStrip() {
  const shippedCount = roadmapCapabilities.filter(
    (capability) => capability.status === "shipped",
  ).length;
  return (
    <section id="roadmap" className="border-t border-border py-20">
      <div className="mb-10 flex items-end justify-between">
        <h2 className="m-0 font-grotesk text-[clamp(28px,6vw,64px)] font-bold tracking-[-0.5px] text-foreground">
          ROADMAP
        </h2>
        <span className="font-mono text-[11px] uppercase tracking-[2px] text-text-faint">
          {shippedCount} SHIPPED // {roadmapCapabilities.length - shippedCount}{" "}
          PLANNED
        </span>
      </div>
      <div className="grid gap-px bg-border [grid-template-columns:repeat(auto-fill,minmax(16rem,1fr))]">
        {roadmapCapabilities.map((capability) => (
          <div
            key={capability.id}
            className="flex items-center justify-between bg-surface p-5"
          >
            <span className="font-mono text-[13px] uppercase tracking-[1.5px] text-foreground">
              {capability.label}
            </span>
            <span
              className={
                "border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[1.5px] " +
                (capability.status === "shipped"
                  ? "border-primary text-primary"
                  : "border-border text-text-faint")
              }
            >
              {capability.status === "shipped" ? "Shipped" : "Planned"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
