export interface EdrPreCrashSample {
  t: number;
  vehicleSpeed: number;
  longitudinalAccel: number;
  lateralAccel: number;
  verticalAccel?: number;
  yawRate: number;
  acceleratorPedal: number;
  brakePedalApplied: boolean;
  brakePedalPercent?: number;
  steeringWheelAngle: number;
  engineRpm?: number;
  engineThrottle?: number;
  gear?: number;
  serviceBrake?: boolean;
  absActive: boolean;
  escActive: boolean;
  tcsActive?: boolean;
  cruiseControlActive?: boolean;
  cruiseControlSpeed?: number;
  laneKeepActive?: boolean;
  aebActive?: boolean;
  driverSeatbeltStatus: 'buckled' | 'unbuckled' | 'unknown';
  passengerSeatbeltStatus?: 'buckled' | 'unbuckled' | 'occupied-unbuckled' | 'unoccupied';
  vehicleMassEstimate?: number;
  trailerCoupled?: boolean;
}

export interface EdrCrashSample {
  t: number;
  deltaV_longitudinal: number;
  deltaV_lateral: number;
  longitudinalAccel: number;
  lateralAccel: number;
  vehicleRollAngle?: number;
  vehicleRollRate?: number;
  vehiclePitchAngle?: number;
}

export interface EdrEvents {
  triggerEvent: 'delta_v_threshold' | 'airbag_deployment' | 'rollover' | 'multi_event';
  triggerTime: number;
  airbagDeployment: {
    driverFrontal?: { deployed: boolean; timeToDeploy?: number; stages?: number[] };
    passengerFrontal?: { deployed: boolean; timeToDeploy?: number; stages?: number[] };
    driverSide?: { deployed: boolean; timeToDeploy?: number };
    passengerSide?: { deployed: boolean; timeToDeploy?: number };
    curtainLeft?: { deployed: boolean; timeToDeploy?: number };
    curtainRight?: { deployed: boolean; timeToDeploy?: number };
    knee?: { deployed: boolean; timeToDeploy?: number };
  };
  seatbeltPretensioner: {
    driver: { activated: boolean; timeToActivate?: number };
    passenger: { activated: boolean; timeToActivate?: number };
  };
  multiEventCount: 0 | 1 | 2;
  timeBetweenEvents?: number;
}

export interface EdrRecord {
  vehicle: {
    category: 'M1' | 'N1' | 'M2' | 'M3' | 'N2' | 'N3';
    mass_kerb_kg: number;
    mass_total_kg: number;
    wheelbase_mm: number;
    track_mm: number;
    cog_height_mm: number;
    length_mm: number;
    width_mm: number;
    bodyType: 'sedan' | 'suv' | 'hatchback' | 'van' | 'truck' | 'bus';
  };
  preCrash: EdrPreCrashSample[];
  crash: EdrCrashSample[];
  events: EdrEvents;
  recordId: string;
  recordedAt: string;
}
