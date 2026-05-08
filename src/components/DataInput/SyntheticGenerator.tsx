import { useState } from 'react';
import { Cpu } from 'lucide-react';
import { generateEdrRecord, type GeneratorParams } from '../../edr/generator';
import { useAnalysis } from '../../store/analysisContext';
import { Button } from '../ui/Button';
import { MU_LABELS } from '../../physics/constants';

const SCENARIOS: { value: GeneratorParams['scenario']; label: string }[] = [
  { value: 'frontal_impact', label: 'Coliziune frontală (obstacol fix)' },
  { value: 'lateral_t-bone', label: 'T-bone lateral (intersecție)' },
  { value: 'rear_end', label: 'Coliziune din spate' },
  { value: 'run_off_road', label: 'Ieșire de pe drum' },
  { value: 'rollover', label: 'Carambol / capotare' },
];

export function SyntheticGenerator() {
  const { runAnalysis } = useAnalysis();
  const [params, setParams] = useState<GeneratorParams>({
    scenario: 'frontal_impact',
    vehicleCategory: 'M1',
    approachSpeed_kmh: 70,
    driverReaction: 'normal',
    prt_s: 1.5,
    surface: 'dry_asphalt',
    absWorking: true,
    escWorking: true,
  });

  const set = <K extends keyof GeneratorParams>(key: K, value: GeneratorParams[K]) =>
    setParams(p => ({ ...p, [key]: value }));

  const selectClass = "w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-red-500";
  const labelClass = "block text-xs text-zinc-500 mb-1 uppercase tracking-wide";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Scenariu</label>
          <select className={selectClass} value={params.scenario} onChange={e => set('scenario', e.target.value as GeneratorParams['scenario'])}>
            {SCENARIOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Categorie vehicul</label>
          <select className={selectClass} value={params.vehicleCategory} onChange={e => set('vehicleCategory', e.target.value as GeneratorParams['vehicleCategory'])}>
            {['M1', 'N1', 'M2', 'M3', 'N2', 'N3'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Viteză abordare: {params.approachSpeed_kmh} km/h</label>
          <input type="range" min={20} max={140} value={params.approachSpeed_kmh}
            onChange={e => set('approachSpeed_kmh', parseInt(e.target.value))}
            className="w-full accent-red-500" />
        </div>
        <div>
          <label className={labelClass}>Reacție șofer</label>
          <select className={selectClass} value={params.driverReaction} onChange={e => set('driverReaction', e.target.value as GeneratorParams['driverReaction'])}>
            <option value="fast">Rapid (PRT ~0.8s)</option>
            <option value="normal">Normal (PRT ~1.5s)</option>
            <option value="slow">Lent (PRT ~2.5s)</option>
            <option value="no_reaction">Fără reacție</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Suprafață</label>
          <select className={selectClass} value={params.surface} onChange={e => set('surface', e.target.value as GeneratorParams['surface'])}>
            {Object.entries(MU_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="flex flex-col justify-end gap-2">
          <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
            <input type="checkbox" checked={params.absWorking} onChange={e => set('absWorking', e.target.checked)} className="accent-red-500" />
            ABS funcțional
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
            <input type="checkbox" checked={params.escWorking} onChange={e => set('escWorking', e.target.checked)} className="accent-red-500" />
            ESC funcțional
          </label>
        </div>
      </div>

      <Button variant="primary" className="w-full justify-center" onClick={() => {
        const record = generateEdrRecord(params);
        runAnalysis(record);
      }}>
        <Cpu className="w-4 h-4" />
        Generează și Analizează
      </Button>
    </div>
  );
}
