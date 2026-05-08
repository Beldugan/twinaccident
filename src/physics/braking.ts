import { G } from './constants';

export function theoreticalBrakingDistance(speed_kmh: number, mu: number): number {
  const v = speed_kmh / 3.6;
  return (v * v) / (2 * mu * G);
}

export function totalStoppingDistance(speed_kmh: number, mu: number, prt_s: number): number {
  const v = speed_kmh / 3.6;
  return v * prt_s + (v * v) / (2 * mu * G);
}

export function estimatedMu(speed_kmh: number, brakingDist_m: number): number {
  const v = speed_kmh / 3.6;
  return (v * v) / (2 * brakingDist_m * G);
}

export function maxDeceleration_g(mu: number): number {
  return mu;
}
