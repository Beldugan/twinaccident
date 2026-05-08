import { BookOpen, Car, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { parseEdrCsv } from '../../edr/parser';
import { useAnalysis } from '../../store/analysisContext';
import { Button } from '../ui/Button';

const PRESETS = [
  {
    id: 'scenario_01_frontal_impact',
    name: 'Scenariu 01 — Coliziune frontală',
    desc: 'VW Golf, 65 km/h, obstacol fix. PRT normal, ABS activ, airbag frontal.',
    severity: 'moderate',
    color: '#f59e0b',
  },
  {
    id: 'scenario_02_lateral_tbone',
    name: 'Scenariu 02 — T-bone lateral',
    desc: 'Renault Master 50 km/h lovit lateral de Tesla Model 3 70 km/h.',
    severity: 'severe',
    color: '#ef4444',
  },
  {
    id: 'scenario_03_rear_end',
    name: 'Scenariu 03 — Coliziune din spate',
    desc: 'Dacia Logan staționar, lovit de BMW 80 km/h (șofer adormit).',
    severity: 'severe',
    color: '#ef4444',
  },
  {
    id: 'scenario_04_run_off_road',
    name: 'Scenariu 04 — Run-off + Capotare',
    desc: 'SUV pe drum umed, ESC defect simulat, pierde controlul, capotează.',
    severity: 'fatal',
    color: '#dc2626',
  },
];

export function PresetPicker() {
  const { runAnalysis } = useAnalysis();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPreset = async (id: string) => {
    setLoading(id);
    setError(null);
    try {
      const base = import.meta.env.BASE_URL ?? '/';
      const res = await fetch(`${base}samples/${id}.csv`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const record = parseEdrCsv(text);
      runAnalysis(record);
    } catch (e) {
      setError(`Nu s-a putut încărca scenariul: ${String(e)}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      {PRESETS.map(p => (
        <div key={p.id} className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
          <Car className="w-6 h-6 flex-shrink-0" style={{ color: p.color }} />
          <div className="flex-1 min-w-0">
            <p className="text-zinc-200 text-sm font-medium">{p.name}</p>
            <p className="text-zinc-500 text-xs truncate">{p.desc}</p>
          </div>
          <Button size="sm" variant="secondary" disabled={loading === p.id} onClick={() => loadPreset(p.id)}>
            {loading === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <BookOpen className="w-3 h-3" />}
            Încarcă
          </Button>
        </div>
      ))}
      {error && <p className="text-red-400 text-sm p-2 bg-red-950/30 rounded-lg">{error}</p>}
    </div>
  );
}
