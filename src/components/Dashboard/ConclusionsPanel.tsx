import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import type { AnalysisConclusions } from '../../analysis/conclusions';

interface ConclusionsPanelProps {
  conclusions: AnalysisConclusions;
}

export function ConclusionsPanel({ conclusions }: ConclusionsPanelProps) {
  return (
    <div className="space-y-4 p-4">
      <div>
        <h4 className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Sumar executiv</h4>
        <p className="text-zinc-200 text-sm leading-relaxed">{conclusions.summary}</p>
      </div>

      <div>
        <h4 className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Cauza probabilă</h4>
        <p className="text-zinc-200 text-sm leading-relaxed">{conclusions.causeDescription}</p>
      </div>

      <div>
        <h4 className="text-xs text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
          Recomandări
        </h4>
        <ul className="space-y-1.5">
          {conclusions.recommendations.map((r, i) => (
            <li key={i} className="flex gap-2 text-sm text-zinc-300">
              <span className="text-green-500 font-mono flex-shrink-0">{i + 1}.</span>
              {r}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="text-xs text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          Limitări analiză
        </h4>
        <ul className="space-y-1.5">
          {conclusions.limitations.map((l, i) => (
            <li key={i} className="flex gap-2 text-xs text-zinc-500">
              <span className="text-amber-500 flex-shrink-0">•</span>
              {l}
            </li>
          ))}
        </ul>
      </div>

      <div className="p-3 bg-zinc-800 border border-zinc-700 rounded-lg">
        <div className="flex gap-2">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-500 leading-relaxed">{conclusions.disclaimer}</p>
        </div>
      </div>
    </div>
  );
}
