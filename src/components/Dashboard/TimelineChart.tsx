import { useState } from 'react';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { EdrRecord } from '../../edr/schema';
import type { BehaviorAnalysis } from '../../analysis/driverBehavior';

interface TimelineChartProps {
  record: EdrRecord;
  behavior: BehaviorAnalysis;
  onProgressChange?: (t: number) => void;
}

const CUSTOM_TOOLTIP = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-xs font-mono">
      <p className="text-zinc-400 mb-1">t = {Number(label).toFixed(1)} s</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {Number(p.value).toFixed(2)}
        </p>
      ))}
    </div>
  );
};

export function TimelineChart({ record, behavior }: TimelineChartProps) {
  const [activeLines, setActiveLines] = useState({
    vehicleSpeed: true,
    longitudinalAccel: true,
    lateralAccel: false,
    yawRate: false,
    brakePedalPercent: true,
    steeringWheelAngle: false,
  });

  const data = record.preCrash.map(s => ({
    t: s.t,
    vehicleSpeed: s.vehicleSpeed,
    longitudinalAccel: s.longitudinalAccel,
    lateralAccel: s.lateralAccel,
    yawRate: s.yawRate,
    brakePedalPercent: s.brakePedalPercent ?? (s.brakePedalApplied ? 100 : 0),
    steeringWheelAngle: s.steeringWheelAngle / 10,
  }));

  const lines: Array<{ key: keyof typeof activeLines; color: string; label: string; yAxis: string }> = [
    { key: 'vehicleSpeed', color: '#3b82f6', label: 'Viteză (km/h)', yAxis: 'speed' },
    { key: 'longitudinalAccel', color: '#ef4444', label: 'Accel. long. (g)', yAxis: 'accel' },
    { key: 'lateralAccel', color: '#f59e0b', label: 'Accel. lat. (g)', yAxis: 'accel' },
    { key: 'yawRate', color: '#a855f7', label: 'Yaw rate (°/s)', yAxis: 'yaw' },
    { key: 'brakePedalPercent', color: '#10b981', label: 'Frână (%)', yAxis: 'brake' },
    { key: 'steeringWheelAngle', color: '#06b6d4', label: 'Volan (°/10)', yAxis: 'steer' },
  ];

  return (
    <div className="space-y-3">
      {/* Toggle buttons */}
      <div className="flex flex-wrap gap-2">
        {lines.map(l => (
          <button
            key={l.key}
            onClick={() => setActiveLines(prev => ({ ...prev, [l.key]: !prev[l.key] }))}
            className={`text-xs px-2 py-1 rounded-full border transition-colors ${
              activeLines[l.key]
                ? 'border-transparent text-white'
                : 'border-zinc-700 text-zinc-500 bg-transparent'
            }`}
            style={activeLines[l.key] ? { backgroundColor: l.color } : {}}
          >
            {l.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey="t"
            type="number"
            domain={['dataMin', 'dataMax']}
            tick={{ fill: '#71717a', fontSize: 11 }}
            tickFormatter={v => `${v.toFixed(1)}s`}
          />
          <YAxis yAxisId="speed" tick={{ fill: '#71717a', fontSize: 11 }} domain={[0, 'auto']} />
          <YAxis yAxisId="accel" orientation="right" tick={{ fill: '#71717a', fontSize: 11 }} />
          <YAxis yAxisId="yaw" hide />
          <YAxis yAxisId="brake" hide />
          <YAxis yAxisId="steer" hide />

          <Tooltip content={<CUSTOM_TOOLTIP />} />

          {behavior.firstBrakeApplication_t !== null && (
            <ReferenceLine
              x={behavior.firstBrakeApplication_t}
              stroke="#10b981"
              strokeDasharray="4 2"
              yAxisId="speed"
              label={{ value: 'FRÂNĂ', fill: '#10b981', fontSize: 10, position: 'top' }}
            />
          )}
          <ReferenceLine
            x={behavior.estimatedHazardOnset_t}
            stroke="#f59e0b"
            strokeDasharray="4 2"
            yAxisId="speed"
            label={{ value: 'PERICOL', fill: '#f59e0b', fontSize: 10, position: 'top' }}
          />
          <ReferenceLine x={0} stroke="#ef4444" strokeWidth={2} yAxisId="speed"
            label={{ value: 'IMPACT', fill: '#ef4444', fontSize: 10, position: 'top' }} />

          {lines.map(l => activeLines[l.key] && (
            <Line
              key={l.key}
              type="monotone"
              dataKey={l.key}
              yAxisId={l.yAxis}
              stroke={l.color}
              strokeWidth={2}
              dot={{ r: 3, fill: l.color }}
              activeDot={{ r: 5 }}
              name={l.label}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Crash data mini chart */}
      {record.crash.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wide">Date crash (zona T=0)</p>
          <ResponsiveContainer width="100%" height={120}>
            <ComposedChart data={record.crash} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="t" tick={{ fill: '#71717a', fontSize: 10 }} tickFormatter={v => `${(v * 1000).toFixed(0)}ms`} />
              <YAxis tick={{ fill: '#71717a', fontSize: 10 }} />
              <Tooltip content={<CUSTOM_TOOLTIP />} />
              <Line type="monotone" dataKey="deltaV_longitudinal" stroke="#ef4444" strokeWidth={2} dot={false} name="ΔV long (km/h)" />
              <Line type="monotone" dataKey="longitudinalAccel" stroke="#f59e0b" strokeWidth={2} dot={false} name="Accel (g)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
