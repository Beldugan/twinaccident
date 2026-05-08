import type { ReconstructionResult } from '../../analysis/reconstruction';
import type { BehaviorAnalysis } from '../../analysis/driverBehavior';
import type { SafetyAudit } from '../../analysis/safetyAudit';
import { SEVERITY_COLORS, SYSTEM_COLORS } from '../../utils/colors';
import { fmtSpeed, fmtTime, fmtEnergy } from '../../utils/formatting';

interface KpiCardsProps {
  reconstruction: ReconstructionResult;
  behavior: BehaviorAnalysis;
  audit: SafetyAudit;
}

function KpiItem({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-zinc-500 uppercase tracking-wide mb-0.5">{label}</span>
      <span className="font-mono text-xl font-bold" style={{ color: color ?? '#f4f4f5' }}>{value}</span>
      {sub && <span className="text-xs text-zinc-500 mt-0.5">{sub}</span>}
    </div>
  );
}

const SEVERITY_LABELS: Record<string, string> = {
  minor: 'MINORĂ',
  moderate: 'MODERATĂ',
  severe: 'SEVERĂ',
  fatal: 'FATALĂ',
};

function PrtLabel(assessment: string): string {
  switch (assessment) {
    case 'fast': return 'RAPID';
    case 'normal': return 'NORMAL';
    case 'slow': return 'LENT';
    case 'no_reaction': return 'FĂRĂ REACȚIE';
    case 'stationary_victim': return 'VICTIMĂ STAȚIONARĂ';
    default: return assessment.toUpperCase();
  }
}

export function KpiCards({ reconstruction, behavior, audit }: KpiCardsProps) {
  const sevColor = SEVERITY_COLORS[reconstruction.severityClass];
  const sysColor = SYSTEM_COLORS[audit.overallSystemPerformance];
  const isVictim = behavior.isStationaryVictim;

  const prtColor = behavior.prtAssessment === 'fast' || behavior.prtAssessment === 'stationary_victim'
    ? '#10b981'
    : behavior.prtAssessment === 'normal' ? '#f4f4f5' : '#ef4444';

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Reconstruction */}
      <div className="col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs text-zinc-500 uppercase tracking-widest">Reconstituire</h4>
          {isVictim && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-800">
              Victimă staționară
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <KpiItem
            label={isVictim ? 'Viteză proprie' : 'Viteză impact'}
            value={isVictim ? '0.0 km/h' : fmtSpeed(reconstruction.impactSpeed_kmh)}
            sub={isVictim ? 'Staționar la semafor' : undefined}
          />
          <KpiItem label="Delta-V total" value={fmtSpeed(reconstruction.deltaV_total_kmh)} color={sevColor} />
          <KpiItem label="Severitate" value={SEVERITY_LABELS[reconstruction.severityClass]} color={sevColor} />
          <KpiItem
            label={isVictim ? 'Energie absorbită' : 'Energie disipată'}
            value={fmtEnergy(reconstruction.energyDissipatedAtImpact_J)}
          />
          <KpiItem
            label={isVictim ? 'Accelerație vârf' : 'Decelerare vârf'}
            value={`${reconstruction.peakDeceleration_g.toFixed(1)} g`}
            color="#ef4444"
          />
          <KpiItem label="Durată crash" value={`${reconstruction.crashDuration_ms.toFixed(0)} ms`} />
        </div>
      </div>

      {/* Behavior */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <h4 className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Comportament șofer</h4>
        {isVictim ? (
          <div className="space-y-2">
            <div className="p-2 rounded-lg bg-green-950/30 border border-green-900">
              <p className="text-green-400 text-xs font-semibold">VICTIMĂ — Fără vină</p>
              <p className="text-zinc-400 text-xs mt-1">
                Vehicul staționar lovit din spate. Analiza PRT și vina nu se aplică șoferului victimă.
              </p>
            </div>
            <KpiItem label="Vină estimată" value="0%" color="#10b981" />
          </div>
        ) : (
          <div className="space-y-2">
            <KpiItem
              label="PRT calculat"
              value={fmtTime(behavior.prtCalculated_s)}
              sub={`${PrtLabel(behavior.prtAssessment)} (ref. ${behavior.prtBenchmark_s}s Olson)`}
              color={prtColor}
            />
            <KpiItem
              label="Vină estimată"
              value={`${behavior.driverFault_estimated_percent}%`}
              color={behavior.driverFault_estimated_percent > 60 ? '#ef4444' : behavior.driverFault_estimated_percent > 30 ? '#f59e0b' : '#10b981'}
            />
            <div className="pt-1">
              <span className="text-xs text-zinc-500">Putea evita: </span>
              <span className="text-sm font-semibold" style={{ color: behavior.couldHaveAvoided ? '#10b981' : '#ef4444' }}>
                {behavior.couldHaveAvoided ? 'DA' : 'NU'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Safety */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <h4 className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Audit sisteme</h4>
        <div className="space-y-1.5">
          {[
            { label: 'ABS', status: audit.abs.assessment },
            { label: 'ESC', status: audit.esc.assessment },
            { label: 'Airbag', status: audit.airbag.deploymentAssessment },
            { label: 'Centură', status: audit.seatbelt.assessment },
          ].map(({ label, status }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">{label}</span>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  color: SYSTEM_COLORS[status] ?? '#71717a',
                  backgroundColor: `${SYSTEM_COLORS[status] ?? '#71717a'}22`,
                }}
              >
                {status.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
          ))}
          <div className="pt-1 border-t border-zinc-800">
            <span className="text-xs text-zinc-500">Global: </span>
            <span className="text-sm font-bold" style={{ color: sysColor }}>
              {audit.overallSystemPerformance.replace(/_/g, ' ').toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
