import { createContext, useContext, useReducer, type ReactNode } from 'react';
import { reducer, initialState, type AnalysisState, type AppAction } from './reducer';
import { reconstructAccident } from '../analysis/reconstruction';
import { analyzeBehavior } from '../analysis/driverBehavior';
import { auditSafetySystems } from '../analysis/safetyAudit';
import { generateConclusions } from '../analysis/conclusions';
import type { EdrRecord } from '../edr/schema';

interface AnalysisContextValue {
  state: AnalysisState;
  dispatch: React.Dispatch<AppAction>;
  runAnalysis: (record: EdrRecord) => void;
}

const AnalysisContext = createContext<AnalysisContextValue | null>(null);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  function runAnalysis(record: EdrRecord) {
    // Rămânem pe ecranul input cu spinner până calculul se termină
    dispatch({ type: 'SET_ANALYZING', value: true });
    dispatch({ type: 'SET_ERROR', error: null });
    dispatch({ type: 'SET_PRIMARY_RECORD', record });

    try {
      const reconstruction = reconstructAccident(record);
      const behavior = analyzeBehavior(record, state.surface, state.speedLimit_kmh);
      const audit = auditSafetySystems(record, state.surface);
      const conclusions = generateConclusions(reconstruction, behavior, audit, record.recordId);
      // SET_RESULTS schimbă ecranul pe 'dashboard' — se face o singură dată cu toate datele
      dispatch({ type: 'SET_RESULTS', reconstruction, behavior, audit, conclusions });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: `Eroare la analiză: ${String(err)}` });
    }
  }

  return (
    <AnalysisContext.Provider value={{ state, dispatch, runAnalysis }}>
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error('useAnalysis must be used inside AnalysisProvider');
  return ctx;
}
