import { describe, expect, it } from "vitest";
import {
  GRAPH_FIELD_LINK_DISTANCE,
  GRAPH_FIELD_MAX_PARTICLES,
  advanceGraphFieldParticle,
  countParticlesForBounds,
  createGraphFieldParticles,
  graphFieldLinkOpacity,
  type GraphFieldBounds,
} from "../src/jarvis/graph-field-simulation";

const bounds: GraphFieldBounds = { width: 200, height: 100 };

describe("advanceGraphFieldParticle", () => {
  it("advances a particle by its velocity while inside the bounds", () => {
    const next = advanceGraphFieldParticle(
      { x: 50, y: 40, velocityX: 3, velocityY: -2 },
      bounds,
    );
    expect(next.x).toBe(53);
    expect(next.y).toBe(38);
    expect(next.velocityX).toBe(3);
    expect(next.velocityY).toBe(-2);
  });

  it("reflects velocity and clamps inside the bounds at every edge", () => {
    const speeds = [-9, -3, 4, 11];
    for (const velocityX of speeds) {
      for (const velocityY of speeds) {
        let particle = { x: 5, y: 5, velocityX, velocityY };
        for (let step = 0; step < 200; step += 1) {
          particle = advanceGraphFieldParticle(particle, bounds);
          expect(particle.x).toBeGreaterThanOrEqual(0);
          expect(particle.x).toBeLessThanOrEqual(bounds.width);
          expect(particle.y).toBeGreaterThanOrEqual(0);
          expect(particle.y).toBeLessThanOrEqual(bounds.height);
        }
      }
    }
  });

  it("inverts the horizontal velocity when crossing the left edge", () => {
    const next = advanceGraphFieldParticle(
      { x: 1, y: 50, velocityX: -4, velocityY: 0 },
      bounds,
    );
    expect(next.velocityX).toBe(4);
  });
});

describe("countParticlesForBounds", () => {
  it("scales the count with the area and caps at the maximum", () => {
    expect(countParticlesForBounds({ width: 0, height: 0 })).toBe(0);
    expect(countParticlesForBounds({ width: 300, height: 300 })).toBe(10);
    expect(countParticlesForBounds({ width: 4000, height: 4000 })).toBe(
      GRAPH_FIELD_MAX_PARTICLES,
    );
  });
});

describe("createGraphFieldParticles", () => {
  it("creates the requested count within the bounds from the injected source", () => {
    const sequence = [0, 0.25, 0.5, 0.75, 0.1, 0.9, 0.4, 0.6];
    let cursor = 0;
    const randomUnit = () => sequence[cursor++ % sequence.length] ?? 0;
    const particles = createGraphFieldParticles(2, bounds, randomUnit);
    expect(particles).toHaveLength(2);
    for (const particle of particles) {
      expect(particle.x).toBeGreaterThanOrEqual(0);
      expect(particle.x).toBeLessThanOrEqual(bounds.width);
      expect(particle.y).toBeGreaterThanOrEqual(0);
      expect(particle.y).toBeLessThanOrEqual(bounds.height);
    }
  });
});

describe("graphFieldLinkOpacity", () => {
  it("fades from full at zero distance to zero at the link threshold", () => {
    expect(graphFieldLinkOpacity(0)).toBe(1);
    expect(graphFieldLinkOpacity(GRAPH_FIELD_LINK_DISTANCE)).toBe(0);
    expect(graphFieldLinkOpacity(GRAPH_FIELD_LINK_DISTANCE + 50)).toBe(0);
    expect(graphFieldLinkOpacity(GRAPH_FIELD_LINK_DISTANCE / 2)).toBeCloseTo(
      0.5,
    );
  });
});
