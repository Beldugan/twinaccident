import { BookOpen, Car, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { parseEdrCsv } from '../../edr/parser';
import { validateEdrRecord } from '../../edr/validation';
import { useAnalysis } from '../../store/analysisContext';
import { Button } from '../ui/Button';

const PRESETS = [
  {
    id: 'scenario_01_frontal_impact',
    name: 'Scenariu 01 — Coliziune frontală',
    desc: 'VW Golf, 65 km/h, obstacol fix. PRT normal, ABS activ, airbag frontal.',
    color: '#f59e0b',
    tags: ['M1', 'moderate'],
  },
  {
    id: 'scenario_02_lateral_tbone',
    name: 'Scenariu 02 — T-bone lateral',
    desc: 'Renault Master 50 km/h lovit lateral de Tesla 70 km/h în intersecție.',
    color: '#ef4444',
    tags: ['N1', 'severe'],
  },
  {
    id: 'scenario_03_rear_end',
    name: 'Scenariu 03 — Coliziune din spate',
    desc: 'Dacia Logan staționar la semafor, lovit de BMW 80 km/h (șofer adormit).',
    color: '#ef4444',
    tags: ['M1', 'victimă', 'severe'],
  },
  {
    id: 'scenario_04_run_off_road',
    name: 'Scenariu 04 — Run-off + Capotare',
    desc: 'SUV 88 km/h pe drum umed, ESC defect, pierde controlul, capotează.',
    color: '#dc2626',
    tags: ['M1', 'rollover', 'fatal'],
  },
];

export function PresetPicker() {
  const { runAnalysis } = useAnalysis();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<string | null>(null);

  const loadPreset = async (id: string) => {
    setLoading(id);
    setError(null);
    setLoaded(null);

    try {
      // BASE_URL este setat de Vite la '/twinaccident/' pentru GitHub Pages
      const base = import.meta.env.BASE_URL;
      const url = `${base}samples/${id}.csv`;

      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(
          `Fișierul nu a putut fi descărcat (HTTP ${res.status}). ` +
          `URL: ${url}. ` +
          `Verificați că deployment-ul GitHub Pages este complet.`
        );
      }

      const text = await res.text();

      if (!text.includes('# VEHICLE') || !text.includes('# PRE-CRASH')) {
        throw new Error(
          `Fișierul CSV nu are formatul EDR corect. ` +
          `Conținut primit: ${text.slice(0, 100)}...`
        );
      }

      const record = parseEdrCsv(text);
      const validation = validateEdrRecord(record);

      if (!validation.valid) {
        throw new Error(`Date EDR invalide: ${validation.errors.join('; ')}`);
      }

      setLoaded(id);
      runAnalysis(record);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Eroare — afișată deasupra listei, vizibilă */}
      {error && (
        <div className="p-3 bg-red-950/50 border border-red-700 rounded-lg flex gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 text-sm font-medium">Eroare la încărcare</p>
            <p className="text-red-400 text-xs mt-1 font-mono break-all">{error}</p>
          </div>
        </div>
      )}

      {PRESETS.map(p => (
        <div
          key={p.id}
          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
            loaded === p.id
              ? 'bg-green-950/20 border-green-800'
              : 'bg-zinc-800 border-zinc-700'
          }`}
        >
          <Car className="w-6 h-6 flex-shrink-0" style={{ color: p.color }} />
          <div className="flex-1 min-w-0">
            <p className="text-zinc-200 text-sm font-medium">{p.name}</p>
            <p className="text-zinc-500 text-xs truncate">{p.desc}</p>
            <div className="flex gap-1 mt-1">
              {p.tags.map(t => (
                <span key={t} className="text-xs px-1.5 py-0.5 bg-zinc-700 text-zinc-400 rounded">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            disabled={loading !== null}
            onClick={() => loadPreset(p.id)}
          >
            {loading === p.id ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : loaded === p.id ? (
              <CheckCircle className="w-3 h-3 text-green-400" />
            ) : (
              <BookOpen className="w-3 h-3" />
            )}
            {loading === p.id ? 'Încarcă...' : 'Încarcă'}
          </Button>
        </div>
      ))}

      <p className="text-zinc-600 text-xs text-center pt-1">
        URL date: {import.meta.env.BASE_URL}samples/[id].csv
      </p>
    </div>
  );
}
