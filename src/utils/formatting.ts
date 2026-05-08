export const fmtSpeed = (v: number) => `${v.toFixed(1)} km/h`;
export const fmtAccel = (a: number) => `${a.toFixed(2)} g`;
export const fmtDist = (m: number) => m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${m.toFixed(1)} m`;
export const fmtEnergy = (j: number) => j >= 1000 ? `${(j / 1000).toFixed(1)} kJ` : `${j.toFixed(0)} J`;
export const fmtTime = (s: number) => `${s.toFixed(2)} s`;
export const fmtPercent = (p: number) => `${p.toFixed(0)}%`;
export const fmtAngle = (d: number) => `${d.toFixed(1)}°`;
export const fmtMass = (kg: number) => `${kg.toFixed(0)} kg`;
