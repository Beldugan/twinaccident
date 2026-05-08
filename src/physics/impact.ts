export interface ImpactResult {
  v1Post_kmh: number;
  v2Post_kmh: number;
  deltaV1_kmh: number;
  deltaV2_kmh: number;
  momentumConserved: boolean;
}

export function twoVehicleImpact(
  m1: number, v1_kmh: number,
  m2: number, v2_kmh: number,
  restitution = 0.15
): ImpactResult {
  const v1 = v1_kmh / 3.6;
  const v2 = v2_kmh / 3.6;

  const v1Post = ((m1 - restitution * m2) * v1 + (1 + restitution) * m2 * v2) / (m1 + m2);
  const v2Post = ((m2 - restitution * m1) * v2 + (1 + restitution) * m1 * v1) / (m1 + m2);

  const pBefore = m1 * v1 + m2 * v2;
  const pAfter = m1 * v1Post + m2 * v2Post;
  const momentumConserved = Math.abs(pBefore - pAfter) / Math.max(1, Math.abs(pBefore)) < 0.01;

  return {
    v1Post_kmh: v1Post * 3.6,
    v2Post_kmh: v2Post * 3.6,
    deltaV1_kmh: Math.abs(v1 - v1Post) * 3.6,
    deltaV2_kmh: Math.abs(v2 - v2Post) * 3.6,
    momentumConserved,
  };
}
