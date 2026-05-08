import { Upload, Cpu, BookOpen, Car, Truck } from 'lucide-react';
import { useAnalysis } from '../store/analysisContext';

export function ScenarioSelector() {
  const { dispatch } = useAnalysis();

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">TA</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">TwinAccident</h1>
        </div>
        <p className="text-zinc-400 text-lg max-w-xl">
          Digital Twin pentru reconstrucție și expertiză post-accident pe baza datelor EDR conform UN R160/R169
        </p>
        <div className="flex items-center gap-2 justify-center mt-3">
          <span className="text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded">Master IVM 2026</span>
          <span className="text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded">FIMIM Constanța</span>
          <span className="text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded">v1.0</span>
        </div>
      </div>

      {/* Input Method */}
      <div className="w-full max-w-3xl mb-8">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-4 text-center">
          Cum dorești să încarci datele?
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'input' })}
            className="group p-6 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-red-600 rounded-xl transition-all duration-200 text-left"
          >
            <Upload className="w-8 h-8 text-red-500 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-white font-semibold mb-1">Încarcă CSV</h3>
            <p className="text-zinc-500 text-sm">Date EDR reale exportate din vehicul (format UN R160)</p>
          </button>

          <button
            onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'input' })}
            className="group p-6 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500 rounded-xl transition-all duration-200 text-left"
          >
            <Cpu className="w-8 h-8 text-amber-500 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-white font-semibold mb-1">Generator sintetic</h3>
            <p className="text-zinc-500 text-sm">Generează date EDR simulate pentru testare și demonstrații</p>
          </button>

          <button
            onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'input' })}
            className="group p-6 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-blue-500 rounded-xl transition-all duration-200 text-left"
          >
            <BookOpen className="w-8 h-8 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-white font-semibold mb-1">Scenarii preset</h3>
            <p className="text-zinc-500 text-sm">4 scenarii predefinite cu date realiste pentru studiu</p>
          </button>
        </div>
      </div>

      {/* Vehicle Mode */}
      <div className="w-full max-w-3xl">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-4 text-center">
          Tip scenariu
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => {
              dispatch({ type: 'SET_TWO_VEHICLE_MODE', value: false });
              dispatch({ type: 'SET_SCREEN', screen: 'input' });
            }}
            className="group p-5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-blue-500 rounded-xl transition-all duration-200 flex items-center gap-4"
          >
            <Car className="w-10 h-10 text-blue-500 flex-shrink-0" />
            <div className="text-left">
              <h3 className="text-white font-semibold">Un singur vehicul</h3>
              <p className="text-zinc-500 text-sm">Ieșire de pe drum, coliziune cu obstacol fix, carambol</p>
            </div>
          </button>

          <button
            onClick={() => {
              dispatch({ type: 'SET_TWO_VEHICLE_MODE', value: true });
              dispatch({ type: 'SET_SCREEN', screen: 'input' });
            }}
            className="group p-5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500 rounded-xl transition-all duration-200 flex items-center gap-4"
          >
            <div className="flex -space-x-2 flex-shrink-0">
              <Car className="w-8 h-8 text-blue-500" />
              <Truck className="w-8 h-8 text-amber-500" />
            </div>
            <div className="text-left">
              <h3 className="text-white font-semibold">Două vehicule</h3>
              <p className="text-zinc-500 text-sm">Coliziune frontală, laterală (T-bone), din spate</p>
            </div>
          </button>
        </div>
      </div>

      <p className="mt-10 text-zinc-600 text-xs text-center max-w-lg">
        Ing. Adrian Mircea Beldugan · Universitatea „Ovidius" Constanța · FIMIM · Master IVM 2026
      </p>
    </div>
  );
}
