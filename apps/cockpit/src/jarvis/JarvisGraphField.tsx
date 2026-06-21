import { useEffect, useRef } from "react";
import {
  advanceGraphFieldParticle,
  countParticlesForBounds,
  createGraphFieldParticles,
  graphFieldLinkOpacity,
  type GraphFieldBounds,
  type GraphFieldParticle,
} from "./graph-field-simulation";

const GRAPH_FIELD_ACCENT_VARIABLE = "--ls-color-accent";
const GRAPH_FIELD_ACCENT_FALLBACK = "rgb(245, 200, 66)";

function readAccentColor(element: Element): string {
  const value = window
    .getComputedStyle(element)
    .getPropertyValue(GRAPH_FIELD_ACCENT_VARIABLE)
    .trim();
  return value.length > 0 ? value : GRAPH_FIELD_ACCENT_FALLBACK;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function JarvisGraphField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const accentColor = readAccentColor(canvas);
    const reducedMotion = prefersReducedMotion();
    let bounds: GraphFieldBounds = { width: 0, height: 0 };
    let particles: GraphFieldParticle[] = [];
    let animationFrameId = 0;

    const measure = () => {
      const rect = canvas.getBoundingClientRect();
      bounds = { width: rect.width, height: rect.height };
      canvas.width = Math.max(1, Math.floor(rect.width));
      canvas.height = Math.max(1, Math.floor(rect.height));
      particles = createGraphFieldParticles(
        countParticlesForBounds(bounds),
        bounds,
        Math.random,
      );
    };

    const paint = () => {
      context.clearRect(0, 0, bounds.width, bounds.height);
      for (
        let sourceIndex = 0;
        sourceIndex < particles.length;
        sourceIndex += 1
      ) {
        const source = particles[sourceIndex];
        if (!source) {
          continue;
        }
        for (
          let targetIndex = sourceIndex + 1;
          targetIndex < particles.length;
          targetIndex += 1
        ) {
          const target = particles[targetIndex];
          if (!target) {
            continue;
          }
          const deltaX = source.x - target.x;
          const deltaY = source.y - target.y;
          const opacity = graphFieldLinkOpacity(Math.hypot(deltaX, deltaY));
          if (opacity <= 0) {
            continue;
          }
          context.globalAlpha = opacity * 0.35;
          context.strokeStyle = accentColor;
          context.lineWidth = 1;
          context.beginPath();
          context.moveTo(source.x, source.y);
          context.lineTo(target.x, target.y);
          context.stroke();
        }
      }
      context.globalAlpha = 0.85;
      context.fillStyle = accentColor;
      for (const particle of particles) {
        context.beginPath();
        context.arc(particle.x, particle.y, 1.7, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
    };

    const renderFrame = () => {
      particles = particles.map((particle) =>
        advanceGraphFieldParticle(particle, bounds),
      );
      paint();
      animationFrameId = window.requestAnimationFrame(renderFrame);
    };

    measure();
    window.addEventListener("resize", measure);
    if (reducedMotion) {
      paint();
    } else {
      animationFrameId = window.requestAnimationFrame(renderFrame);
    }

    return () => {
      window.removeEventListener("resize", measure);
      if (animationFrameId !== 0) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
