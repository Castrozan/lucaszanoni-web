import { useEffect, useState } from "react";

export function useScrolledPastThreshold(thresholdInPixels: number): boolean {
  const [hasScrolledPast, setHasScrolledPast] = useState(false);

  useEffect(() => {
    const handleScroll = () =>
      setHasScrolledPast(window.scrollY > thresholdInPixels);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [thresholdInPixels]);

  return hasScrolledPast;
}
