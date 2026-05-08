import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Box, BarChart2, FileText, Download, Play, Pause, RotateCcw } from 'lucide-react';
import { useAnalysis } from '../../store/analysisContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { KpiCards } from './KpiCards';
import { TimelineChart } from './TimelineChart';
import { ConclusionsPanel } from './ConclusionsPanel';
import { Scene3D } from '../../viz3d/Scene';
import { PdfReport } from '../ReportExport/PdfReport';
import { SEVERITY_COLORS } from '../../utils/colors';

type Tab = '3d' | 'charts' | 'report';

const SEVERITY_LABELS: Record<string, string> = {
  minor: 'MINORĂ',
  moderate: 'MODERATĂ',
  severe: 'SEVERĂ',
  fatal: 'FATALĂ',
};

const PLAYBACK_DURATION_MS = 8000; // 8 secunde pentru întreaga simulare

export function Dashboard() {
  const { state, dispatch } = useAnalysis();
  const [tab, setTab] = useState<Tab>('3d');
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const { reconstruction, behavior, audit, conclusions, primaryRecord } = state;
  if (!reconstruction || !behavior || !audit || !conclusions || !primaryRecord) return null;

  // Buclă de animație cu requestAnimationFrame
  useEffect(() => {
    if (!playing) {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      lastTimeRef.current = null;
      return;
    }

    const animate = (timestamp: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = timestamp;
      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      setProgress(prev => {
        const next = prev + delta / PLAYBACK_DURATION_MS;
        if (next >= 1) {
          setPlaying(false);
          return 1;
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
    };
  }, [playing]);

  const handleReset = () => {
    setPlaying(false);
    setProgress(0);
  };

  const sevColor = SEVERITY_COLORS[reconstruction.severityClass];

  const tStart = reconstruction.preCrashTrajectory[0]?.t ?? -5;
  const currentT = tStart + progress * Math.abs(tStart);
  const timeLabel = currentT >= 0
    ? `T+${currentT.toFixed(1)}s`
    : `T${currentT.toFixed(1)}s`;

  const tabBtn = (t: Tab, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => setTab(t)}
      className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors ${
        tab === t ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-6 py-3 bg-zinc-900 border-b border-zinc-800">
        <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'RESET' })}>
          <ArrowLeft className="w-4 h-4" />
          Nouă analiză
        </Button>

        <div className="h-6 w-px bg-zinc-700" />

        <div className="flex items-center gap-2 flex-1">
          <span className="text-zinc-500 text-sm font-mono">{primaryRecord.recordId}</span>
          <Badge color={sevColor}>
            Severitate {SEVERITY_LABELS[reconstruction.severityClass]}
          </Badge>
        </div>

        <Button variant="secondary" size="sm" onClick={() => setTab('report')}>
          <Download className="w-4 h-4" />
          Export PDF
        </Button>
      </div>

      <div className="flex flex-1 gap-0 overflow-hidden">
        {/* Left sidebar: KPI */}
        <div className="w-80 flex-shrink-0 p-4 overflow-y-auto border-r border-zinc-800 space-y-4">
          <KpiCards reconstruction={reconstruction} behavior={behavior} audit={audit} />

          {behavior.contributingFactors.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <h4 className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Factori contribuitori</h4>
              <ul className="space-y-1.5">
                {behavior.contributingFactors.map((f, i) => (
                  <li key={i} className="flex gap-2 text-xs text-zinc-300">
                    <span className="text-red-500 flex-shrink-0">•</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {audit.potentialDefects.length > 0 && (
            <div className="bg-zinc-900 border border-amber-900/50 rounded-xl p-4">
              <h4 className="text-xs text-amber-500 uppercase tracking-widest mb-2">Defecțiuni potențiale</h4>
              <ul className="space-y-1.5">
                {audit.potentialDefects.map((d, i) => (
                  <li key={i} className="flex gap-2 text-xs text-amber-300">
                    <span className="flex-shrink-0">⚠</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800">
            {tabBtn('3d', <Box className="w-4 h-4" />, 'Vizualizare 3D')}
            {tabBtn('charts', <BarChart2 className="w-4 h-4" />, 'Telemetrie')}
            {tabBtn('report', <FileText className="w-4 h-4" />, 'Raport')}
          </div>

          <div className="flex-1 overflow-y-auto">
            {tab === '3d' && (
              <div className="flex flex-col h-full">
                <div className="flex-1 min-h-0" style={{ minHeight: 420 }}>
                  <Scene3D
                    record={primaryRecord}
                    reconstruction={reconstruction}
                    progress={progress}
                  />
                </div>

                {/* Controale animație */}
                <div className="p-4 border-t border-zinc-800">
                  <div className="flex items-center gap-3 mb-2">
                    {/* Play/Pause */}
                    <button
                      className="w-9 h-9 rounded-lg bg-red-600 hover:bg-red-500 flex items-center justify-center text-white transition-colors flex-shrink-0"
                      onClick={() => {
                        if (progress >= 1) { setProgress(0); }
                        setPlaying(p => !p);
                      }}
                      title={playing ? 'Pauză' : 'Play'}
                    >
                      {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    {/* Reset */}
                    <button
                      className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors flex-shrink-0"
                      onClick={handleReset}
                      title="Reîncepere"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    {/* Slider */}
                    <div className="flex-1">
                      <input
                        type="range"
                        min={0}
                        max={1000}
                        value={Math.round(progress * 1000)}
                        onChange={e => {
                          setPlaying(false);
                          setProgress(parseInt(e.target.value) / 1000);
                        }}
                        className="w-full accent-red-500 h-2"
                      />
                    </div>

                    {/* Timp curent */}
                    <span className={`text-sm font-mono w-16 text-right font-bold ${
                      currentT >= 0 ? 'text-red-400' : 'text-zinc-400'
                    }`}>
                      {timeLabel}
                    </span>
                  </div>

                  {/* Legenda timeline */}
                  <div className="flex items-center gap-4 text-xs text-zinc-600">
                    <span>◀ T-5.0s</span>
                    <div className="flex-1 flex items-center gap-1">
                      <div className="flex-1 h-px bg-zinc-800" />
                      <span className="text-zinc-500">pre-crash</span>
                      <div className="flex-1 h-px bg-zinc-800" />
                      <span className="text-red-800 font-bold">T=0 IMPACT</span>
                      <div className="w-8 h-px bg-zinc-800" />
                    </div>
                    <span>T+0s ▶</span>
                  </div>
                </div>
              </div>
            )}

            {tab === 'charts' && (
              <div className="p-4">
                <h3 className="text-sm font-semibold text-zinc-300 mb-4">Telemetrie pre-crash și crash</h3>
                <TimelineChart record={primaryRecord} behavior={behavior} />
              </div>
            )}

            {tab === 'report' && (
              <div className="p-4">
                <ConclusionsPanel conclusions={conclusions} />
                <div className="mt-4 px-4 pb-4">
                  <PdfReport
                    record={primaryRecord}
                    reconstruction={reconstruction}
                    behavior={behavior}
                    audit={audit}
                    conclusions={conclusions}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
