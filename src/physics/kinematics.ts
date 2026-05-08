import type { EdrPreCrashSample } from '../edr/schema';

export interface TrajectoryPoint {
  t: number;
  x: number;
  y: number;
  heading: number;
  v: number;
}

export function reconstructTrajectory(samples: EdrPreCrashSample[]): TrajectoryPoint[] {
  const points: TrajectoryPoint[] = [];
  let x = 0, y = 0, heading = 0;

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    const dt = i === 0 ? 0 : s.t - samples[i - 1].t;
    const v_ms = s.vehicleSpeed / 3.6;

    if (i > 0) {
      heading += (s.yawRate * Math.PI / 180) * dt;
      x += v_ms * Math.cos(heading) * dt;
      y += v_ms * Math.sin(heading) * dt;
    }

    points.push({ t: s.t, x, y, heading, v: s.vehicleSpeed });
  }

  return points;
}

export function interpolateTrajectory(points: TrajectoryPoint[], targetFps = 60): TrajectoryPoint[] {
  if (points.length < 2) return points;
  const result: TrajectoryPoint[] = [];
  const totalTime = points[points.length - 1].t - points[0].t;
  const frameCount = Math.abs(totalTime) * targetFps;

  for (let f = 0; f <= frameCount; f++) {
    const alpha = f / frameCount;
    const t = points[0].t + alpha * totalTime;

    let i = 1;
    while (i < points.length - 1 && points[i].t < t) i++;
    const p0 = points[i - 1];
    const p1 = points[i];
    const localAlpha = (p1.t - p0.t) !== 0 ? (t - p0.t) / (p1.t - p0.t) : 0;

    result.push({
      t,
      x: p0.x + (p1.x - p0.x) * localAlpha,
      y: p0.y + (p1.y - p0.y) * localAlpha,
      heading: p0.heading + (p1.heading - p0.heading) * localAlpha,
      v: p0.v + (p1.v - p0.v) * localAlpha,
    });
  }

  return result;
}

export function totalDistance(points: TrajectoryPoint[]): number {
  let dist = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    dist += Math.sqrt(dx * dx + dy * dy);
  }
  return dist;
}
