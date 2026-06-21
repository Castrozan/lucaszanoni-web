import { useEffect, useState } from "react";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function matchesReducedMotion(): boolean {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }
  return window.matchMedia(reducedMotionQuery).matches;
}

export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] =
    useState(matchesReducedMotion);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }
    const mediaQueryList = window.matchMedia(reducedMotionQuery);
    const handleChange = () => setPrefersReducedMotion(mediaQueryList.matches);
    handleChange();
    mediaQueryList.addEventListener("change", handleChange);
    return () => mediaQueryList.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}
