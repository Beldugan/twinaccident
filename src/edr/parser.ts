import Papa from 'papaparse';
import type { EdrRecord, EdrPreCrashSample, EdrCrashSample, EdrEvents } from './schema';

function parseBool(v: string): boolean {
  return v === '1' || v.toLowerCase() === 'true';
}

export function parseEdrCsv(csvText: string): EdrRecord {
  const sections: Record<string, string[][]> = {};
  let currentSection = '';

  const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  for (const line of lines) {
    if (line.startsWith('#')) {
      currentSection = line.slice(1).trim();
      sections[currentSection] = [];
    } else if (currentSection) {
      const result = Papa.parse<string[]>(line, { skipEmptyLines: true });
      if (result.data[0]) sections[currentSection].push(result.data[0]);
    }
  }

  const vehicleMap: Record<string, string> = {};
  for (const row of sections['VEHICLE'] ?? []) {
    if (row.length >= 2) vehicleMap[row[0]] = row[1];
  }

  const preCrash: EdrPreCrashSample[] = [];
  const [pcHeader, ...pcRows] = sections['PRE-CRASH'] ?? [];
  for (const row of pcRows ?? []) {
    if (!pcHeader) continue;
    const obj: Record<string, string> = {};
    pcHeader.forEach((h, i) => { obj[h.trim()] = (row[i] ?? '').trim(); });
    preCrash.push({
      t: parseFloat(obj.t),
      vehicleSpeed: parseFloat(obj.vehicleSpeed),
      longitudinalAccel: parseFloat(obj.longitudinalAccel),
      lateralAccel: parseFloat(obj.lateralAccel),
      yawRate: parseFloat(obj.yawRate),
      acceleratorPedal: parseFloat(obj.acceleratorPedal),
      brakePedalPercent: obj.brakePedalPercent ? parseFloat(obj.brakePedalPercent) : undefined,
      // brakePedalApplied: true dacă coloana explicită=1/true SAU dacă brakePedalPercent > 2%
      brakePedalApplied: parseBool(obj.brakePedalApplied ?? '0') ||
        (obj.brakePedalPercent ? parseFloat(obj.brakePedalPercent) > 2 : false),
      steeringWheelAngle: parseFloat(obj.steeringWheelAngle),
      engineRpm: obj.engineRpm ? parseFloat(obj.engineRpm) : undefined,
      absActive: parseBool(obj.absActive ?? '0'),
      escActive: parseBool(obj.escActive ?? '0'),
      driverSeatbeltStatus: (obj.driverSeatbeltStatus ?? 'unknown') as EdrPreCrashSample['driverSeatbeltStatus'],
    });
  }

  const crash: EdrCrashSample[] = [];
  const [cHeader, ...cRows] = sections['CRASH'] ?? [];
  for (const row of cRows ?? []) {
    if (!cHeader) continue;
    const obj: Record<string, string> = {};
    cHeader.forEach((h, i) => { obj[h.trim()] = (row[i] ?? '').trim(); });
    crash.push({
      t: parseFloat(obj.t),
      deltaV_longitudinal: parseFloat(obj.deltaV_longitudinal),
      deltaV_lateral: parseFloat(obj.deltaV_lateral),
      longitudinalAccel: parseFloat(obj.longitudinalAccel),
      lateralAccel: parseFloat(obj.lateralAccel),
      vehicleRollAngle: obj.vehicleRollAngle ? parseFloat(obj.vehicleRollAngle) : undefined,
    });
  }

  const evMap: Record<string, string> = {};
  for (const row of sections['EVENTS'] ?? []) {
    if (row.length >= 2) evMap[row[0]] = row[1];
  }

  const events: EdrEvents = {
    triggerEvent: (evMap.triggerEvent ?? 'delta_v_threshold') as EdrEvents['triggerEvent'],
    triggerTime: parseFloat(evMap.triggerTime ?? '0'),
    airbagDeployment: {
      driverFrontal: {
        deployed: parseBool(evMap.driverFrontal_deployed ?? '0'),
        timeToDeploy: evMap.driverFrontal_timeToDeploy ? parseFloat(evMap.driverFrontal_timeToDeploy) : undefined,
      },
      passengerFrontal: {
        deployed: parseBool(evMap.passengerFrontal_deployed ?? '0'),
        timeToDeploy: evMap.passengerFrontal_timeToDeploy ? parseFloat(evMap.passengerFrontal_timeToDeploy) : undefined,
      },
      driverSide: {
        deployed: parseBool(evMap.driverSide_deployed ?? '0'),
        timeToDeploy: evMap.driverSide_timeToDeploy ? parseFloat(evMap.driverSide_timeToDeploy) : undefined,
      },
      passengerSide: {
        deployed: parseBool(evMap.passengerSide_deployed ?? '0'),
      },
      curtainLeft: {
        deployed: parseBool(evMap.curtainLeft_deployed ?? '0'),
      },
      curtainRight: {
        deployed: parseBool(evMap.curtainRight_deployed ?? '0'),
      },
    },
    seatbeltPretensioner: {
      driver: {
        activated: parseBool(evMap.seatbeltPretensioner_driver_activated ?? '0'),
        timeToActivate: evMap.seatbeltPretensioner_driver_timeToActivate
          ? parseFloat(evMap.seatbeltPretensioner_driver_timeToActivate)
          : undefined,
      },
      passenger: {
        activated: parseBool(evMap.seatbeltPretensioner_passenger_activated ?? '0'),
      },
    },
    multiEventCount: (parseInt(evMap.multiEventCount ?? '0') as 0 | 1 | 2),
    timeBetweenEvents: evMap.timeBetweenEvents ? parseFloat(evMap.timeBetweenEvents) : undefined,
  };

  return {
    vehicle: {
      category: (vehicleMap.category ?? 'M1') as EdrRecord['vehicle']['category'],
      mass_kerb_kg: parseFloat(vehicleMap.mass_kerb_kg ?? '1200'),
      mass_total_kg: parseFloat(vehicleMap.mass_total_kg ?? '1350'),
      wheelbase_mm: parseFloat(vehicleMap.wheelbase_mm ?? '2600'),
      track_mm: parseFloat(vehicleMap.track_mm ?? '1500'),
      cog_height_mm: parseFloat(vehicleMap.cog_height_mm ?? '550'),
      length_mm: parseFloat(vehicleMap.length_mm ?? '4200'),
      width_mm: parseFloat(vehicleMap.width_mm ?? '1800'),
      bodyType: (vehicleMap.bodyType ?? 'sedan') as EdrRecord['vehicle']['bodyType'],
    },
    preCrash,
    crash,
    events,
    recordId: vehicleMap.recordId ?? `EDR-${Date.now()}`,
    recordedAt: vehicleMap.recordedAt ?? new Date().toISOString(),
  };
}
