import type { EdrRecord } from './schema';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEdrRecord(record: EdrRecord): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (record.preCrash.length < 8 || record.preCrash.length > 12) {
    warnings.push(`Pre-crash samples: ${record.preCrash.length} (R160 cere 10 la 2 Hz)`);
  }

  for (const s of record.preCrash) {
    if (s.vehicleSpeed < 0 || s.vehicleSpeed > 250) {
      errors.push(`Viteză invalidă la t=${s.t}: ${s.vehicleSpeed} km/h`);
    }
    if (Math.abs(s.longitudinalAccel) > 3) {
      warnings.push(`Accelerație longitudinală mare la t=${s.t}: ${s.longitudinalAccel} g`);
    }
    if (Math.abs(s.lateralAccel) > 3) {
      warnings.push(`Accelerație laterală mare la t=${s.t}: ${s.lateralAccel} g`);
    }
    if (Math.abs(s.yawRate) > 90) {
      warnings.push(`Yaw rate mare la t=${s.t}: ${s.yawRate} °/s`);
    }
  }

  if (record.crash.length < 10) {
    warnings.push(`Date crash insuficiente: ${record.crash.length} samples (minim 25 la 100 Hz)`);
  }

  const deltaVLong = record.crash[record.crash.length - 1]?.deltaV_longitudinal ?? 0;
  const deltaVLat = record.crash[record.crash.length - 1]?.deltaV_lateral ?? 0;
  const deltaVTotal = Math.sqrt(deltaVLong ** 2 + deltaVLat ** 2);

  if (deltaVTotal > 100) {
    errors.push(`Delta-V total prea mare: ${deltaVTotal.toFixed(1)} km/h`);
  }

  if (record.vehicle.mass_kerb_kg < 300 || record.vehicle.mass_kerb_kg > 50000) {
    errors.push(`Masă vehicul invalidă: ${record.vehicle.mass_kerb_kg} kg`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
