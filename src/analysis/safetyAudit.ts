import type { EdrRecord } from '../edr/schema';
import { MU_VALUES, V_CHARACTERISTIC_MS } from '../physics/constants';

export type AbsAssessment = 'normal' | 'late_activation' | 'unjustified' | 'failed_to_trigger';
export type EscAssessment = 'normal' | 'late' | 'failed_to_trigger' | 'not_needed';
export type AirbagAssessment = 'on_time' | 'late' | 'no_deployment_when_required' | 'not_required';
export type SeatbeltAssessment = 'compliant' | 'unbuckled_at_impact' | 'pretensioner_failed';
export type SystemPerformance = 'compliant' | 'partial_failure' | 'system_failure';

export interface SafetyAudit {
  abs: {
    triggered: boolean;
    triggeredAtTime_t: number | null;
    triggerJustified: boolean;
    durationActive_ms: number;
    assessment: AbsAssessment;
  };
  esc: {
    triggered: boolean;
    triggeredAtTime_t: number | null;
    triggerJustified: boolean;
    yawDeviation_deg: number;
    assessment: EscAssessment;
  };
  airbag: {
    deployed: boolean;
    deploymentTime_ms: number;
    deploymentAssessment: AirbagAssessment;
    multiStageTriggered: boolean;
  };
  seatbelt: {
    driverBuckled: boolean;
    pretensionerActivated: boolean;
    pretensionerTime_ms: number;
    assessment: SeatbeltAssessment;
  };
  overallSystemPerformance: SystemPerformance;
  potentialDefects: string[];
}

export function auditSafetySystems(record: EdrRecord, surface = 'dry_asphalt'): SafetyAudit {
  const mu = MU_VALUES[surface] ?? 0.9;
  const samples = record.preCrash;

  // ABS
  const absActivations = samples.filter(s => s.absActive);
  const absTriggered = absActivations.length > 0;
  const absFirstT = absTriggered ? absActivations[0].t : null;
  const hardBrakingSamples = samples.filter(s => s.brakePedalApplied && Math.abs(s.longitudinalAccel) > mu * 0.6);
  const absJustified = hardBrakingSamples.length > 0;
  const absDuration = absTriggered
    ? (absActivations[absActivations.length - 1].t - absActivations[0].t) * 1000
    : 0;

  let absAssessment: AbsAssessment;
  if (!absTriggered && absJustified) absAssessment = 'failed_to_trigger';
  else if (absTriggered && !absJustified) absAssessment = 'unjustified';
  else absAssessment = 'normal';

  // ESC
  const escActivations = samples.filter(s => s.escActive);
  const escTriggered = escActivations.length > 0;
  const escFirstT = escTriggered ? escActivations[0].t : null;

  let maxYawDeviation = 0;
  for (const s of samples) {
    const v_ms = s.vehicleSpeed / 3.6;
    const steeringRad = s.steeringWheelAngle * Math.PI / 180;
    const wheelbase = record.vehicle.wheelbase_mm / 1000;
    const yawExpected = (v_ms * steeringRad / 14) / (wheelbase * (1 + (v_ms / V_CHARACTERISTIC_MS) ** 2));
    const yawDevRad = Math.abs(s.yawRate * Math.PI / 180 - yawExpected);
    if (yawDevRad > maxYawDeviation) maxYawDeviation = yawDevRad;
  }
  const maxYawDevDeg = maxYawDeviation * 180 / Math.PI;
  const escShouldTrigger = maxYawDevDeg > 4;

  let escAssessment: EscAssessment;
  if (!escShouldTrigger) escAssessment = 'not_needed';
  else if (escTriggered) escAssessment = 'normal';
  else escAssessment = 'failed_to_trigger';

  // Airbag
  const lastCrash = record.crash[record.crash.length - 1];
  const deltaVTotal = lastCrash
    ? Math.sqrt(lastCrash.deltaV_longitudinal ** 2 + lastCrash.deltaV_lateral ** 2)
    : 0;
  const airbagRequired = deltaVTotal > 15;
  const airbagDeployed = record.events.airbagDeployment.driverFrontal?.deployed ?? false;
  const airbagTime = (record.events.airbagDeployment.driverFrontal?.timeToDeploy ?? 0) * 1000;

  let airbagAssessment: AirbagAssessment;
  if (!airbagRequired) airbagAssessment = 'not_required';
  else if (!airbagDeployed) airbagAssessment = 'no_deployment_when_required';
  else if (airbagTime > 80) airbagAssessment = 'late';
  else airbagAssessment = 'on_time';

  const multiStage = (record.events.airbagDeployment.driverFrontal?.stages?.length ?? 0) > 1;

  // Seatbelt
  const lastSample = samples[samples.length - 1];
  const driverBuckled = lastSample?.driverSeatbeltStatus === 'buckled';
  const pretensioner = record.events.seatbeltPretensioner.driver;
  const pretTime = (pretensioner.timeToActivate ?? 0) * 1000;

  let seatbeltAssessment: SeatbeltAssessment;
  if (!driverBuckled) seatbeltAssessment = 'unbuckled_at_impact';
  else if (airbagDeployed && !pretensioner.activated) seatbeltAssessment = 'pretensioner_failed';
  else seatbeltAssessment = 'compliant';

  // Overall
  const defects: string[] = [];
  if (absAssessment === 'failed_to_trigger') defects.push('ABS nu s-a activat la frânare forțată');
  if (escAssessment === 'failed_to_trigger') defects.push('ESC nu s-a activat la deviație yaw > 4°/s');
  if (airbagAssessment === 'no_deployment_when_required') defects.push('Airbag-ul frontal nu s-a declanșat deși delta-V > 15 km/h');
  if (seatbeltAssessment === 'pretensioner_failed') defects.push('Pretensionorul centurii nu s-a activat la impact');
  if (!driverBuckled) defects.push('Șoferul nu purta centura la momentul impactului');

  const failureCount = defects.length;
  const overall: SystemPerformance =
    failureCount === 0 ? 'compliant' :
    failureCount <= 2 ? 'partial_failure' : 'system_failure';

  return {
    abs: {
      triggered: absTriggered,
      triggeredAtTime_t: absFirstT,
      triggerJustified: absJustified,
      durationActive_ms: absDuration,
      assessment: absAssessment,
    },
    esc: {
      triggered: escTriggered,
      triggeredAtTime_t: escFirstT,
      triggerJustified: escShouldTrigger,
      yawDeviation_deg: maxYawDevDeg,
      assessment: escAssessment,
    },
    airbag: {
      deployed: airbagDeployed,
      deploymentTime_ms: airbagTime,
      deploymentAssessment: airbagAssessment,
      multiStageTriggered: multiStage,
    },
    seatbelt: {
      driverBuckled,
      pretensionerActivated: pretensioner.activated,
      pretensionerTime_ms: pretTime,
      assessment: seatbeltAssessment,
    },
    overallSystemPerformance: overall,
    potentialDefects: defects,
  };
}
