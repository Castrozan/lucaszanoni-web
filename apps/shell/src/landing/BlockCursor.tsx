import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

export interface BlockCursorProps {
  readonly className?: string;
}

export function BlockCursor({ className }: BlockCursorProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  return (
    <span
      aria-hidden="true"
      className={
        "ml-1 inline-block h-[0.9em] w-[0.55em] translate-y-[0.08em] bg-primary " +
        (prefersReducedMotion ? "" : "animate-pulse ") +
        (className ?? "")
      }
    />
  );
}
