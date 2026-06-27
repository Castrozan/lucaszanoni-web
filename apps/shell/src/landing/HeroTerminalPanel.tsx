import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { BlockCursor } from "./BlockCursor";
import { terminalContent } from "./landingContent";

const trafficLightColors = ["#FF5F57", "#FEBC2E", "#4ADE80"];

export function HeroTerminalPanel() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const terminalLines = terminalContent.lines;
  const [visibleLineCount, setVisibleLineCount] = useState(
    prefersReducedMotion ? terminalLines.length : 0,
  );

  useEffect(() => {
    if (prefersReducedMotion) {
      setVisibleLineCount(terminalLines.length);
      return;
    }
    setVisibleLineCount(0);
    let currentCount = 0;
    const interval = setInterval(() => {
      currentCount += 1;
      setVisibleLineCount(currentCount);
      if (currentCount >= terminalLines.length) {
        clearInterval(interval);
      }
    }, 700);
    return () => clearInterval(interval);
  }, [prefersReducedMotion, terminalLines.length]);

  return (
    <div className="border-2 border-border bg-surface">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          {trafficLightColors.map((color) => (
            <span
              key={color}
              className="h-[8px] w-[8px] rounded-full"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <span className="font-mono text-[11px] tracking-[1px] text-muted-foreground">
          {terminalContent.promptLabel}
        </span>
      </div>
      <div className="flex flex-col gap-1 px-4 py-5">
        {terminalLines.slice(0, visibleLineCount).map((line, index) => (
          <p
            key={`${line.kind}-${index}`}
            className={
              "m-0 font-mono text-[12px] leading-[1.7] tracking-[0.5px] " +
              (line.kind === "command"
                ? "text-foreground"
                : "text-muted-foreground")
            }
          >
            {line.text}
            {index === visibleLineCount - 1 &&
            visibleLineCount === terminalLines.length ? (
              <BlockCursor />
            ) : null}
          </p>
        ))}
      </div>
    </div>
  );
}
