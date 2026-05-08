import { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { parseEdrCsv } from '../../edr/parser';
import { validateEdrRecord } from '../../edr/validation';
import { useAnalysis } from '../../store/analysisContext';

export function CsvUploader() {
  const { runAnalysis } = useAnalysis();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setWarnings([]);
    try {
      const text = await file.text();
      const record = parseEdrCsv(text);
      const validation = validateEdrRecord(record);
      if (!validation.valid) {
        setError(`Date EDR invalide: ${validation.errors.join('; ')}`);
        return;
      }
      if (validation.warnings.length > 0) setWarnings(validation.warnings);
      runAnalysis(record);
    } catch (e) {
      setError(`Eroare la parsarea fișierului: ${String(e)}`);
    }
  }, [runAnalysis]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
          isDragging ? 'border-red-500 bg-red-950/20' : 'border-zinc-700 hover:border-zinc-500'
        }`}
        onClick={() => document.getElementById('csv-input')?.click()}
      >
        <Upload className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
        <p className="text-zinc-300 font-medium">Drag & drop fișier CSV</p>
        <p className="text-zinc-500 text-sm mt-1">sau click pentru selectare</p>
        <p className="text-zinc-600 text-xs mt-2">Format EDR conform UN R160/R169</p>
        <input id="csv-input" type="file" accept=".csv,.txt" className="hidden" onChange={handleFileInput} />
      </div>

      {error && (
        <div className="flex gap-2 p-3 bg-red-950/30 border border-red-800 rounded-lg text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="p-3 bg-amber-950/30 border border-amber-800 rounded-lg text-amber-300 text-sm space-y-1">
          {warnings.map((w, i) => (
            <div key={i} className="flex gap-2">
              <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
