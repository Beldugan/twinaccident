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

  // Overlay de loading — acoperă toată pagina cât durează analiza
  if (state.isAnalyzing) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-300 text-lg font-medium">Analizează datele EDR...</p>
        <p className="text-zinc-500 text-sm">Reconstituire cinematică, comportament șofer, audit sisteme</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6"
          onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'selector' })}
        >
          <ArrowLeft className="w-4 h-4" />
          Înapoi
        </Button>

        <h2 className="text-2xl font-bold text-white mb-2">Configurare analiză EDR</h2>
        <p className="text-zinc-500 mb-6">
          {state.twoVehicleMode ? 'Mod: Două vehicule' : 'Mod: Un singur vehicul'}
        </p>

        {/* Eroare globală din store (ex. eroare de parsare) */}
        {state.error && (
          <div className="mb-4 p-4 bg-red-950/40 border border-red-700 rounded-xl text-red-300 text-sm">
            <p className="font-medium mb-1">Eroare analiză</p>
            <p className="font-mono text-xs break-all">{state.error}</p>
            <button
              className="mt-2 text-xs text-red-400 underline"
              onClick={() => dispatch({ type: 'SET_ERROR', error: null })}
            >
              Închide
            </button>
          </div>
        )}

        {/* Sursa datelor */}
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

        {/* Parametri mediu */}
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
      </div>
    </div>
  );
}
