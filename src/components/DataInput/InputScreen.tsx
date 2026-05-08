import { useState } from 'react';
import { ArrowLeft, Upload, Cpu, BookOpen } from 'lucide-react';
import { useAnalysis } from '../../store/analysisContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { CsvUploader } from './CsvUploader';
import { SyntheticGenerator } from './SyntheticGenerator';
import { PresetPicker } from './PresetPicker';
import { MU_LABELS } from '../../physics/constants';

type Tab = 'csv' | 'synthetic' | 'preset';

export function InputScreen() {
  const { state, dispatch } = useAnalysis();
  const [tab, setTab] = useState<Tab>('preset');

  const tabBtn = (t: Tab, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => setTab(t)}
      className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
        tab === t ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Back */}
        <Button variant="ghost" size="sm" className="mb-6" onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'selector' })}>
          <ArrowLeft className="w-4 h-4" />
          Înapoi
        </Button>

        <h2 className="text-2xl font-bold text-white mb-2">Configurare analiză EDR</h2>
        <p className="text-zinc-500 mb-6">
          {state.twoVehicleMode ? 'Mod: Două vehicule' : 'Mod: Un singur vehicul'}
        </p>

        {/* Data input */}
        <Card className="mb-4" title="Sursa datelor EDR">
          <div className="p-4">
            <div className="flex gap-2 mb-4">
              {tabBtn('preset', <BookOpen className="w-4 h-4" />, 'Scenarii preset')}
              {tabBtn('synthetic', <Cpu className="w-4 h-4" />, 'Generator sintetic')}
              {tabBtn('csv', <Upload className="w-4 h-4" />, 'Fișier CSV')}
            </div>

            {tab === 'csv' && <CsvUploader />}
            {tab === 'synthetic' && <SyntheticGenerator />}
            {tab === 'preset' && <PresetPicker />}
          </div>
        </Card>

        {/* Environment params */}
        <Card title="Parametri mediu">
          <div className="p-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wide">
                Suprafață carosabil
              </label>
              <select
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm"
                value={state.surface}
                onChange={e => dispatch({ type: 'SET_SURFACE', surface: e.target.value })}
              >
                {Object.entries(MU_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wide">
                Limită de viteză (km/h)
              </label>
              <input
                type="number"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm"
                value={state.speedLimit_kmh}
                onChange={e => dispatch({ type: 'SET_SPEED_LIMIT', limit: parseInt(e.target.value) || 90 })}
                min={10}
                max={200}
              />
            </div>
          </div>
        </Card>

        {state.isAnalyzing && (
          <div className="mt-4 flex items-center justify-center gap-3 p-4 bg-zinc-900 rounded-xl">
            <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-zinc-300">Rulează analiza fizică...</span>
          </div>
        )}

        {state.error && (
          <div className="mt-4 p-4 bg-red-950/30 border border-red-800 rounded-xl text-red-300 text-sm">
            {state.error}
          </div>
        )}
      </div>
    </div>
  );
}
