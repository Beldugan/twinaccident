import type { EdrRecord } from '../edr/schema';
import { reconstructTrajectory, totalDistance, type TrajectoryPoint } from '../physics/kinematics';
import { kineticEnergy } from '../physics/energy';

export type SeverityClass = 'minor' | 'moderate' | 'severe' | 'fatal';

export interface ReconstructionResult {
  preCrashTrajectory: TrajectoryPoint[];
  averageSpeed_kmh: number;
  maxSpeed_kmh: number;
  totalDistanceTraveled_m: number;
  impactSpeed_kmh: number;
  impactKineticEnergy_J: number;
  impactDirection_deg: number;
  deltaV_total_kmh: number;
  deltaV_longitudinal_kmh: number;
  deltaV_lateral_kmh: number;
  crashDuration_ms: number;
  peakDeceleration_g: number;
  energyDissipatedAtImpact_J: number;
  energyRatio: number;
  severityClass: SeverityClass;
  isStationaryVictim: boolean;
}

function classifySeverity(deltaV: number): SeverityClass {
  if (deltaV < 16) return 'minor';
  if (deltaV < 32) return 'moderate';
  if (deltaV < 56) return 'severe';
  return 'fatal';
}

export function reconstructAccident(record: EdrRecord): ReconstructionResult {
  const trajectory = reconstructTrajectory(record.preCrash);
  const speeds = record.preCrash.map(s => s.vehicleSpeed);
  const averageSpeed = speeds.length > 0
    ? speeds.reduce((a, b) => a + b, 0) / speeds.length
    : 0;
  const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
  const distance = totalDistance(trajectory);

  const impactSpeed = record.preCrash[record.preCrash.length - 1]?.vehicleSpeed ?? 0;
  const mass = record.vehicle.mass_total_kg;

  // Detectare victimă staționară (lovită din spate)
  const isStationaryVictim = maxSpeed < 3.0;

  const lastCrash = record.crash[record.crash.length - 1];
  const deltaVLong = Math.abs(lastCrash?.deltaV_longitudinal ?? 0);
  const deltaVLat = Math.abs(lastCrash?.deltaV_lateral ?? 0);
  const deltaVTotal = Math.sqrt(deltaVLong ** 2 + deltaVLat ** 2);

  const peakDecel = record.crash.length > 0
    ? Math.max(...record.crash.map(c => Math.abs(c.longitudinalAccel)))
    : 0;
  const crashDuration = record.crash.length > 1
    ? (record.crash[record.crash.length - 1].t - record.crash[0].t) * 1000
    : 0;

  // Energia disipată:
  // - Vehicul activ: energia cinetică pierdută (frânare + deformare)
  // - Victimă staționară: energia absorbită din coliziune = KE câștigată din delta-V
  let eDissipated: number;
  let impactKE: number;

  if (isStationaryVictim) {
    // Victima era la 0 km/h; energia vine de la agresor
    // Calculăm energia absorbită de vehiculul victimei
    const vPost = deltaVTotal / 3.6;
    eDissipated = 0.5 * mass * vPost * vPost;
    impactKE = eDissipated; // energia relevantă = cea transmisă
  } else {
    impactKE = kineticEnergy(mass, impactSpeed);
    const vPost_ms = Math.max(0, (impactSpeed - deltaVLong) / 3.6);
    const vPre_ms = impactSpeed / 3.6;
    eDissipated = 0.5 * mass * (vPre_ms * vPre_ms - vPost_ms * vPost_ms);
  }

  const eRatio = impactKE > 0 ? Math.min(1, Math.abs(eDissipated) / impactKE) : 0;

  const impactAngle = deltaVLong > 0
    ? Math.atan2(deltaVLat, deltaVLong) * 180 / Math.PI
    : 0;

  return {
    preCrashTrajectory: trajectory,
    averageSpeed_kmh: averageSpeed,
    maxSpeed_kmh: maxSpeed,
    totalDistanceTraveled_m: distance,
    impactSpeed_kmh: impactSpeed,
    impactKineticEnergy_J: impactKE,
    impactDirection_deg: impactAngle,
    deltaV_total_kmh: deltaVTotal,
    deltaV_longitudinal_kmh: deltaVLong,
    deltaV_lateral_kmh: deltaVLat,
    crashDuration_ms: crashDuration,
    peakDeceleration_g: peakDecel,
    energyDissipatedAtImpact_J: eDissipated,
    energyRatio: eRatio,
    severityClass: classifySeverity(deltaVTotal),
    isStationaryVictim,
  };
}
