import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { BlockCursor } from "./BlockCursor";

interface TerminalLine {
  readonly kind: "command" | "output";
  readonly text: string;
}

const terminalLines: readonly TerminalLine[] = [
  { kind: "command", text: "$ curl lucaszanoni.com/engineering/reports/" },
  { kind: "output", text: "→ 200 OK  served from cloudflare edge" },
  { kind: "output", text: "→ micro-frontend: reports  build: static-spa" },
  { kind: "command", text: "$ open /engineering/dotfiles/claude/usage/" },
  { kind: "output", text: "→ live operational dashboard mounted" },
];

const trafficLightColors = ["#FF5F57", "#FEBC2E", "#4ADE80"];

export function HeroTerminalPanel() {
  const prefersReducedMotion = usePrefersReducedMotion();
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
  }, [prefersReducedMotion]);

  return (
    <div className="border-2 border-[#2D2D2D] bg-surface">
      <div className="flex items-center gap-3 border-b border-[#2D2D2D] px-4 py-3">
        <div className="flex items-center gap-2">
          {trafficLightColors.map((color) => (
            <span
              key={color}
              className="h-[8px] w-[8px] rounded-full"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <span className="font-mono text-[11px] tracking-[1px] text-text-faint">
          ~/lucaszanoni — zsh
        </span>
      </div>
      <div className="flex flex-col gap-1 px-4 py-5">
        {terminalLines.slice(0, visibleLineCount).map((line, index) => (
          <p
            key={`${line.kind}-${index}`}
            className={
              "m-0 font-mono text-[12px] leading-[1.7] tracking-[0.5px] " +
              (line.kind === "command" ? "text-foreground" : "text-text-faint")
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
