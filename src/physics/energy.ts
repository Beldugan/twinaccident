export function kineticEnergy(mass_kg: number, speed_kmh: number): number {
  const v = speed_kmh / 3.6;
  return 0.5 * mass_kg * v * v;
}

export function energyDissipated(mass_kg: number, v_pre_kmh: number, deltaV_kmh: number): number {
  const vPost = Math.max(0, v_pre_kmh - deltaV_kmh);
  return kineticEnergy(mass_kg, v_pre_kmh) - kineticEnergy(mass_kg, vPost);
}

export function energyRatio(mass_kg: number, v_pre_kmh: number, deltaV_kmh: number): number {
  const eKin = kineticEnergy(mass_kg, v_pre_kmh);
  if (eKin === 0) return 0;
  return energyDissipated(mass_kg, v_pre_kmh, deltaV_kmh) / eKin;
}
