import { useState } from 'react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { EdrRecord } from '../../edr/schema';
import type { BehaviorAnalysis } from '../../analysis/driverBehavior';

interface TimelineChartProps {
  record: EdrRecord;
  behavior: BehaviorAnalysis;
}

const CUSTOM_TOOLTIP = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-xs font-mono">
      <p className="text-zinc-400 mb-1">t = {Number(label).toFixed(label < 1 ? 3 : 1)} s</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {Number(p.value).toFixed(2)}
        </p>
      ))}
    </div>
  );
};

export function TimelineChart({ record, behavior }: TimelineChartProps) {
  const isStationary = behavior.isStationaryVictim;

  const [activeLines, setActiveLines] = useState({
    vehicleSpeed: !isStationary,
    longitudinalAccel: true,
    lateralAccel: false,
    yawRate: false,
    brakePedalPercent: !isStationary,
    steeringWheelAngle: false,
  });

  const preCrashData = record.preCrash.map(s => ({
    t: s.t,
    vehicleSpeed: s.vehicleSpeed,
    longitudinalAccel: s.longitudinalAccel,
    lateralAccel: s.lateralAccel,
    yawRate: s.yawRate,
    brakePedalPercent: s.brakePedalPercent ?? (s.brakePedalApplied ? 100 : 0),
    steeringWheelAngle: s.steeringWheelAngle / 10,
  }));

  const crashData = record.crash.map(s => ({
    t: s.t,
    deltaV_long: s.deltaV_longitudinal,
    deltaV_lat: Math.abs(s.deltaV_lateral),
    accel_g: Math.abs(s.longitudinalAccel),
    rollAngle: s.vehicleRollAngle ?? 0,
  }));

  const lines = [
    { key: 'vehicleSpeed' as const, color: '#3b82f6', label: 'Viteză (km/h)', yAxis: 'speed' },
    { key: 'longitudinalAccel' as const, color: '#ef4444', label: 'Accel. long. (g)', yAxis: 'accel' },
    { key: 'lateralAccel' as const, color: '#f59e0b', label: 'Accel. lat. (g)', yAxis: 'accel' },
    { key: 'yawRate' as const, color: '#a855f7', label: 'Yaw rate (°/s)', yAxis: 'yaw' },
    { key: 'brakePedalPercent' as const, color: '#10b981', label: 'Frână (%)', yAxis: 'brake' },
    { key: 'steeringWheelAngle' as const, color: '#06b6d4', label: 'Volan (°/10)', yAxis: 'steer' },
  ];

  const maxDeltaV = Math.max(...crashData.map(d => Math.max(d.deltaV_long, d.deltaV_lat)));
  const maxAccel = Math.max(...crashData.map(d => d.accel_g));

  return (
    <div className="space-y-4">

      {/* ── GRAFIC CRASH (primar pentru victimă staționară) ── */}
      {crashData.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
              Date crash — zona T=0
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-900">
              {((crashData[crashData.length - 1]?.t ?? 0) * 1000).toFixed(0)} ms
            </span>
          </div>
          <div className="flex gap-4 mb-2 text-xs font-mono">
            <span className="text-blue-400">
              ΔV max: <strong>{maxDeltaV.toFixed(1)} km/h</strong>
            </span>
            <span className="text-red-400">
              Accel. vârf: <strong>{maxAccel.toFixed(1)} g</strong>
            </span>
          </div>
          <ResponsiveContainer width="100%" height={isStationary ? 220 : 140}>
            <ComposedChart data={crashData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="t" tick={{ fill: '#71717a', fontSize: 10 }}
                tickFormatter={v => `${(v * 1000).toFixed(0)}ms`} />
              <YAxis yAxisId="dv" tick={{ fill: '#71717a', fontSize: 10 }} domain={[0, 'auto']}
                label={{ value: 'km/h', angle: -90, position: 'insideLeft', fill: '#52525b', fontSize: 9 }} />
              <YAxis yAxisId="g" orientation="right" tick={{ fill: '#71717a', fontSize: 10 }}
                label={{ value: 'g', angle: 90, position: 'insideRight', fill: '#52525b', fontSize: 9 }} />
              <Tooltip content={<CUSTOM_TOOLTIP />} />
              <Area yAxisId="dv" type="monotone" dataKey="deltaV_long" stroke="#3b82f6"
                fill="#3b82f620" strokeWidth={2} dot={false} name="ΔV longitudinal (km/h)" />
              {Math.max(...crashData.map(d => d.deltaV_lat)) > 2 && (
                <Area yAxisId="dv" type="monotone" dataKey="deltaV_lat" stroke="#06b6d4"
                  fill="#06b6d420" strokeWidth={2} dot={false} name="ΔV lateral (km/h)" />
              )}
              <Line yAxisId="g" type="monotone" dataKey="accel_g" stroke="#ef4444"
                strokeWidth={2} dot={false} name="Accelerație vârf (g)" />
              {Math.max(...crashData.map(d => d.rollAngle)) > 5 && (
                <Line yAxisId="g" type="monotone" dataKey="rollAngle" stroke="#f59e0b"
                  strokeWidth={1.5} dot={false} name="Unghi ruliu (°)" strokeDasharray="4 2" />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── GRAFIC PRE-CRASH ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">
            Telemetrie pre-crash (−5s → T=0)
          </span>
          {isStationary && (
            <span className="text-xs px-2 py-0.5 bg-blue-950 text-blue-400 border border-blue-900 rounded-full">
              Vehicul staționat — semnale la zero
            </span>
          )}
        </div>

        {isStationary ? (
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-center">
            <p className="text-zinc-400 text-sm mb-1">
              Vehiculul victimă era complet staționat la semafor în cele 5 secunde pre-crash.
            </p>
            <p className="text-zinc-500 text-xs">
              Viteză = 0 km/h · Frână = 0% · Volan = 0° · ABS/ESC inactive
            </p>
            <p className="text-zinc-500 text-xs mt-1">
              Datele relevante sunt în graficul crash de mai sus.
            </p>
          </div>
        ) : (
          <>
            {/* Toggle butoane */}
            <div className="flex flex-wrap gap-2 mb-3">
              {lines.map(l => (
                <button key={l.key}
                  onClick={() => setActiveLines(prev => ({ ...prev, [l.key]: !prev[l.key] }))}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                    activeLines[l.key] ? 'border-transparent text-white' : 'border-zinc-700 text-zinc-500'
                  }`}
                  style={activeLines[l.key] ? { backgroundColor: l.color } : {}}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={preCrashData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']}
                  tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={v => `${v.toFixed(1)}s`} />
                <YAxis yAxisId="speed" tick={{ fill: '#71717a', fontSize: 11 }} domain={[0, 'auto']} />
                <YAxis yAxisId="accel" orientation="right" tick={{ fill: '#71717a', fontSize: 11 }} />
                <YAxis yAxisId="yaw" hide />
                <YAxis yAxisId="brake" hide />
                <YAxis yAxisId="steer" hide />
                <Tooltip content={<CUSTOM_TOOLTIP />} />

                {behavior.firstBrakeApplication_t !== null && (
                  <ReferenceLine x={behavior.firstBrakeApplication_t} stroke="#10b981"
                    strokeDasharray="4 2" yAxisId="speed"
                    label={{ value: 'FRÂNĂ', fill: '#10b981', fontSize: 10, position: 'top' }} />
                )}
                <ReferenceLine x={behavior.estimatedHazardOnset_t} stroke="#f59e0b"
                  strokeDasharray="4 2" yAxisId="speed"
                  label={{ value: 'PERICOL', fill: '#f59e0b', fontSize: 10, position: 'top' }} />
                <ReferenceLine x={0} stroke="#ef4444" strokeWidth={2} yAxisId="speed"
                  label={{ value: 'IMPACT', fill: '#ef4444', fontSize: 10, position: 'top' }} />

                {lines.map(l => activeLines[l.key] && (
                  <Line key={l.key} type="monotone" dataKey={l.key} yAxisId={l.yAxis}
                    stroke={l.color} strokeWidth={2} dot={{ r: 3, fill: l.color }}
                    activeDot={{ r: 5 }} name={l.label} />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </div>
  );
}
