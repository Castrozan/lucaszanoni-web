export interface GraphFieldBounds {
  readonly width: number;
  readonly height: number;
}

export interface GraphFieldParticle {
  readonly x: number;
  readonly y: number;
  readonly velocityX: number;
  readonly velocityY: number;
}

export const GRAPH_FIELD_LINK_DISTANCE = 130;
export const GRAPH_FIELD_PARTICLE_SPEED = 0.45;
export const GRAPH_FIELD_PARTICLE_DENSITY_DIVISOR = 9000;
export const GRAPH_FIELD_MAX_PARTICLES = 96;

export function countParticlesForBounds(bounds: GraphFieldBounds): number {
  const area = Math.max(0, bounds.width) * Math.max(0, bounds.height);
  return Math.min(
    GRAPH_FIELD_MAX_PARTICLES,
    Math.floor(area / GRAPH_FIELD_PARTICLE_DENSITY_DIVISOR),
  );
}

export function createGraphFieldParticles(
  count: number,
  bounds: GraphFieldBounds,
  randomUnit: () => number,
): GraphFieldParticle[] {
  const particles: GraphFieldParticle[] = [];
  for (let index = 0; index < count; index += 1) {
    particles.push({
      x: randomUnit() * bounds.width,
      y: randomUnit() * bounds.height,
      velocityX: (randomUnit() - 0.5) * 2 * GRAPH_FIELD_PARTICLE_SPEED,
      velocityY: (randomUnit() - 0.5) * 2 * GRAPH_FIELD_PARTICLE_SPEED,
    });
  }
  return particles;
}

export function advanceGraphFieldParticle(
  particle: GraphFieldParticle,
  bounds: GraphFieldBounds,
): GraphFieldParticle {
  let x = particle.x + particle.velocityX;
  let y = particle.y + particle.velocityY;
  let velocityX = particle.velocityX;
  let velocityY = particle.velocityY;
  if (x < 0) {
    x = -x;
    velocityX = -velocityX;
  } else if (x > bounds.width) {
    x = bounds.width - (x - bounds.width);
    velocityX = -velocityX;
  }
  if (y < 0) {
    y = -y;
    velocityY = -velocityY;
  } else if (y > bounds.height) {
    y = bounds.height - (y - bounds.height);
    velocityY = -velocityY;
  }
  return {
    x: Math.min(Math.max(x, 0), bounds.width),
    y: Math.min(Math.max(y, 0), bounds.height),
    velocityX,
    velocityY,
  };
}

export function graphFieldLinkOpacity(distance: number): number {
  if (distance >= GRAPH_FIELD_LINK_DISTANCE) {
    return 0;
  }
  return 1 - distance / GRAPH_FIELD_LINK_DISTANCE;
}
