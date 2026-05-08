import type { EdrRecord, EdrPreCrashSample, EdrCrashSample } from './schema';
import { MU_VALUES } from '../physics/constants';

export interface GeneratorParams {
  scenario: 'frontal_impact' | 'lateral_t-bone' | 'rear_end' | 'run_off_road' | 'rollover';
  vehicleCategory: 'M1' | 'N1' | 'M2' | 'M3' | 'N2' | 'N3';
  approachSpeed_kmh: number;
  driverReaction: 'normal' | 'slow' | 'no_reaction' | 'fast';
  prt_s: number;
  surface: 'dry_asphalt' | 'wet_asphalt' | 'snow' | 'ice';
  absWorking: boolean;
  escWorking: boolean;
  mass_kerb_kg?: number;
}

const PRT_MAP: Record<GeneratorParams['driverReaction'], number> = {
  fast: 0.8,
  normal: 1.5,
  slow: 2.5,
  no_reaction: 5.0,
};

function noise(amplitude: number): number {
  return (Math.random() - 0.5) * 2 * amplitude;
}

function generateRecordId(): string {
  return `EDR-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

export function generateEdrRecord(params: GeneratorParams): EdrRecord {
  const prt = PRT_MAP[params.driverReaction];
  const mu = MU_VALUES[params.surface];
  const g = 9.81;
  const v0_ms = params.approachSpeed_kmh / 3.6;
  const massKerb = params.mass_kerb_kg ?? (params.vehicleCategory === 'M1' ? 1400 : 3500);
  const massTotal = massKerb * 1.05;

  const isRunOff = params.scenario === 'run_off_road' || params.scenario === 'rollover';
  const isRear = params.scenario === 'rear_end';
  const isLateral = params.scenario === 'lateral_t-bone';

  const preCrash: EdrPreCrashSample[] = [];

  for (let i = 0; i <= 9; i++) {
    const t = -5.0 + i * 0.5;
    const timeToImpact = Math.abs(t);
    const prtApplied = timeToImpact < prt ? false : true;
    const decelerating = prtApplied && timeToImpact < prt + 3;
    const brakeForce = decelerating ? mu * g : 0;
    const currentSpeed_ms = Math.max(0, v0_ms - brakeForce * Math.max(0, (prt + 3 - timeToImpact)));

    const isRunOffSteering = isRunOff && timeToImpact < 2.5;
    const yawBase = isRunOffSteering ? (2.5 - timeToImpact) * 15 * (params.escWorking ? 0.3 : 1.0) : 0;
    const latAccBase = isRunOffSteering ? (2.5 - timeToImpact) * 0.4 : 0;
    const isLateralDodge = isLateral && timeToImpact < 1.5 && params.driverReaction !== 'no_reaction';
    const steeringAngle = isLateralDodge ? 45 * (1.5 - timeToImpact) / 1.5 : isRunOffSteering ? -30 * (2.5 - timeToImpact) / 2.5 : noise(2);

    preCrash.push({
      t,
      vehicleSpeed: currentSpeed_ms * 3.6 + noise(0.5),
      longitudinalAccel: decelerating ? -(brakeForce / g) + noise(0.02) : noise(0.02),
      lateralAccel: latAccBase + noise(0.02),
      yawRate: yawBase + noise(0.3),
      acceleratorPedal: decelerating ? 0 : Math.max(0, 25 + noise(5)),
      brakePedalApplied: decelerating,
      brakePedalPercent: decelerating ? Math.min(100, (brakeForce / g) * 100 / mu + noise(5)) : 0,
      steeringWheelAngle: steeringAngle,
      engineRpm: decelerating ? 1200 + noise(100) : 2200 + (currentSpeed_ms * 3.6 / 130) * 1500 + noise(100),
      absActive: decelerating && params.absWorking && brakeForce > 0,
      escActive: isRunOffSteering && params.escWorking && !params.escWorking ? true : false,
      driverSeatbeltStatus: 'buckled',
    });
  }

  const impactSpeed_ms = preCrash[preCrash.length - 1].vehicleSpeed / 3.6;
  const deltaV_base = isRear ? params.approachSpeed_kmh * 0.6 : impactSpeed_ms * 3.6 * (isRunOff ? 0.5 : 0.7);
  const deltaV_long = isLateral ? deltaV_base * 0.3 : deltaV_base;
  const deltaV_lat = isLateral ? deltaV_base * 0.85 : isRunOff ? deltaV_base * 0.2 : 0;
  const rolloverEvent = params.scenario === 'rollover';

  const crash: EdrCrashSample[] = [];
  const crashDuration = 0.25;
  const sampleCount = 25;

  for (let i = 0; i < sampleCount; i++) {
    const t = i * (crashDuration / sampleCount);
    const progress = i / sampleCount;
    const peakFactor = Math.sin(Math.PI * progress);
    const peakDecel_g = (deltaV_long / 3.6) / (crashDuration * g) * 3;

    crash.push({
      t,
      deltaV_longitudinal: deltaV_long * progress + noise(0.2),
      deltaV_lateral: deltaV_lat * progress + noise(0.1),
      longitudinalAccel: -(peakDecel_g * peakFactor) + noise(0.5),
      lateralAccel: isLateral ? -(deltaV_lat / 3.6) / (crashDuration * g) * 2 * peakFactor + noise(0.3) : noise(0.3),
      vehicleRollAngle: rolloverEvent ? progress * 110 : noise(0.5),
      vehicleRollRate: rolloverEvent ? 440 * peakFactor : noise(1),
    });
  }

  const severity_deltaV = Math.sqrt(deltaV_long ** 2 + deltaV_lat ** 2);
  const airbagDeployed = severity_deltaV > 15;
  const sideAirbag = isLateral && severity_deltaV > 12;
  const curtainAirbag = rolloverEvent || (sideAirbag && severity_deltaV > 20);

  return {
    vehicle: {
      category: params.vehicleCategory,
      mass_kerb_kg: massKerb,
      mass_total_kg: massTotal,
      wheelbase_mm: params.vehicleCategory === 'M1' ? 2637 : 3200,
      track_mm: params.vehicleCategory === 'M1' ? 1510 : 1800,
      cog_height_mm: params.vehicleCategory === 'M1' ? 550 : 850,
      length_mm: params.vehicleCategory === 'M1' ? 4480 : 5500,
      width_mm: params.vehicleCategory === 'M1' ? 1850 : 2100,
      bodyType: params.vehicleCategory === 'M1' ? 'sedan' : 'van',
    },
    preCrash,
    crash,
    events: {
      triggerEvent: rolloverEvent ? 'rollover' : airbagDeployed ? 'airbag_deployment' : 'delta_v_threshold',
      triggerTime: 0.0,
      airbagDeployment: {
        driverFrontal: { deployed: airbagDeployed, timeToDeploy: airbagDeployed ? 0.042 : undefined },
        passengerFrontal: { deployed: airbagDeployed, timeToDeploy: airbagDeployed ? 0.045 : undefined },
        driverSide: { deployed: sideAirbag, timeToDeploy: sideAirbag ? 0.018 : undefined },
        passengerSide: { deployed: sideAirbag },
        curtainLeft: { deployed: curtainAirbag },
        curtainRight: { deployed: curtainAirbag },
      },
      seatbeltPretensioner: {
        driver: { activated: airbagDeployed || severity_deltaV > 8, timeToActivate: 0.012 },
        passenger: { activated: airbagDeployed },
      },
      multiEventCount: params.scenario === 'rear_end' ? 1 : 0,
      timeBetweenEvents: params.scenario === 'rear_end' ? 0.35 : undefined,
    },
    recordId: generateRecordId(),
    recordedAt: new Date().toISOString(),
  };
}
