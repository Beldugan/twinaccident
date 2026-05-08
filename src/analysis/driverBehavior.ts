import type { EdrRecord } from '../edr/schema';
import { totalStoppingDistance, theoreticalBrakingDistance } from '../physics/braking';
import { MU_VALUES } from '../physics/constants';

export type PrtAssessment = 'fast' | 'normal' | 'slow' | 'no_reaction' | 'stationary_victim';

export interface BehaviorAnalysis {
  firstBrakeApplication_t: number | null;
  firstSteeringAction_t: number | null;
  estimatedHazardOnset_t: number;
  prtCalculated_s: number;
  prtAssessment: PrtAssessment;
  prtBenchmark_s: 1.5;
  theoreticalStoppingDistance_m: number;
  actualStoppingDistance_m: number;
  couldHaveAvoided: boolean;
  speedReductionPossible_kmh: number;
  excessiveSpeed: boolean;
  inadequateBraking: boolean;
  panicSteering: boolean;
  noReaction: boolean;
  isStationaryVictim: boolean;
  driverFault_estimated_percent: number;
  contributingFactors: string[];
}

function detectHazardOnset(record: EdrRecord): number {
  const samples = record.preCrash;
  let maxGradient = 0;
  let onsetIdx = 0;

  for (let i = 1; i < samples.length; i++) {
    const dYaw = Math.abs(samples[i].yawRate - samples[i - 1].yawRate);
    const dLat = Math.abs(samples[i].lateralAccel - samples[i - 1].lateralAccel);
    const gradient = dYaw + dLat * 5;
    if (gradient > maxGradient) {
      maxGradient = gradient;
      onsetIdx = i - 1;
    }
  }

  if (maxGradient < 0.5 && samples.length > 0) {
    return samples[0].t;
  }
  return samples[onsetIdx]?.t ?? -5.0;
}

export function analyzeBehavior(
  record: EdrRecord,
  surface: string = 'dry_asphalt',
  speedLimit_kmh = 90
): BehaviorAnalysis {
  const mu = MU_VALUES[surface] ?? 0.9;
  const samples = record.preCrash;
  const impactSpeed = samples[samples.length - 1]?.vehicleSpeed ?? 0;
  const initialSpeed = samples[0]?.vehicleSpeed ?? 0;

  // Vehicul staționat lovit din spate — victimă, nu cauza accidentului
  const maxPreCrashSpeed = Math.max(...samples.map(s => s.vehicleSpeed));
  const isStationaryVictim = maxPreCrashSpeed < 3.0;

  if (isStationaryVictim) {
    return {
      firstBrakeApplication_t: null,
      firstSteeringAction_t: null,
      estimatedHazardOnset_t: samples[0]?.t ?? -5.0,
      prtCalculated_s: 0,
      prtAssessment: 'stationary_victim',
      prtBenchmark_s: 1.5,
      theoreticalStoppingDistance_m: 0,
      actualStoppingDistance_m: 0,
      couldHaveAvoided: false,
      speedReductionPossible_kmh: 0,
      excessiveSpeed: false,
      inadequateBraking: false,
      panicSteering: false,
      noReaction: false,
      isStationaryVictim: true,
      driverFault_estimated_percent: 0,
      contributingFactors: ['Vehicul staționat — victimă a coliziunii din spate'],
    };
  }

  let firstBrake_t: number | null = null;
  let firstSteering_t: number | null = null;

  for (const s of samples) {
    if (firstBrake_t === null && s.brakePedalApplied) firstBrake_t = s.t;
    if (firstSteering_t === null && Math.abs(s.steeringWheelAngle) > 30) firstSteering_t = s.t;
  }

  const hazardOnset = detectHazardOnset(record);
  // Prima reacție = cea mai timpurie dintre frână și volan
  const firstReaction =
    firstBrake_t !== null && firstSteering_t !== null
      ? Math.min(firstBrake_t, firstSteering_t)
      : firstBrake_t ?? firstSteering_t;
  const prt = firstReaction !== null
    ? Math.max(0, firstReaction - hazardOnset)
    : 3.5;

  let prtAssessment: PrtAssessment;
  if (firstReaction === null) prtAssessment = 'no_reaction';
  else if (prt < 1.0) prtAssessment = 'fast';
  else if (prt < 2.0) prtAssessment = 'normal';
  else prtAssessment = 'slow';

  const theoreticalDist = totalStoppingDistance(initialSpeed, mu, 1.5);
  const actualDist = totalStoppingDistance(initialSpeed, mu, prt);
  const distanceAtImpact = actualDist - theoreticalBrakingDistance(impactSpeed, mu);

  const couldHaveAvoided = theoreticalDist < distanceAtImpact && impactSpeed > 5;
  const speedReductionPossible = Math.max(0, initialSpeed - impactSpeed);

  const excessiveSpeed = initialSpeed > speedLimit_kmh + 10;
  const inadequateBraking = firstBrake_t !== null && prtAssessment !== 'no_reaction' &&
    samples.some(s => s.brakePedalApplied && (s.brakePedalPercent ?? 100) < 40 && impactSpeed > 20);
  const panicSteering = firstSteering_t !== null && (firstBrake_t === null || Math.abs(firstSteering_t - (firstBrake_t ?? 0)) < 0.2);
  const noReaction = prtAssessment === 'no_reaction';

  const factors: string[] = [];
  if (excessiveSpeed) factors.push(`Viteză excesivă (${initialSpeed.toFixed(0)} km/h, limită ${speedLimit_kmh} km/h)`);
  if (noReaction) factors.push('Nicio reacție detectată (șofer posibil distras/adormit)');
  if (prtAssessment === 'slow') factors.push(`Timp de reacție lent: ${prt.toFixed(2)} s (referință 1.5 s)`);
  if (inadequateBraking) factors.push('Frânare insuficientă față de condiții');
  if (panicSteering) factors.push('Virare bruscă fără frânare adecvată (panică)');

  let fault = 0;
  if (noReaction) fault += 60;
  else if (prtAssessment === 'slow') fault += 25;
  if (excessiveSpeed) fault += 30;
  if (inadequateBraking) fault += 15;
  if (panicSteering) fault += 10;
  fault = Math.min(100, fault);

  return {
    firstBrakeApplication_t: firstBrake_t,
    firstSteeringAction_t: firstSteering_t,
    estimatedHazardOnset_t: hazardOnset,
    prtCalculated_s: prt,
    prtAssessment,
    prtBenchmark_s: 1.5,
    theoreticalStoppingDistance_m: theoreticalDist,
    actualStoppingDistance_m: actualDist,
    couldHaveAvoided,
    speedReductionPossible_kmh: speedReductionPossible,
    excessiveSpeed,
    inadequateBraking,
    panicSteering,
    noReaction,
    isStationaryVictim: false,
    driverFault_estimated_percent: fault,
    contributingFactors: factors,
  };
}
