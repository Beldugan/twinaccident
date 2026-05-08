export const G = 9.81;
export const RHO_AIR = 1.225;

export const MU_VALUES: Record<string, number> = {
  dry_asphalt: 0.9,
  wet_asphalt: 0.5,
  snow: 0.3,
  ice: 0.1,
};

export const MU_LABELS: Record<string, string> = {
  dry_asphalt: 'Asfalt uscat',
  wet_asphalt: 'Asfalt umed',
  snow: 'Zăpadă tasată',
  ice: 'Gheață',
};

export const V_CHARACTERISTIC_MS = 17;
