import type { EdrRecord } from '../edr/schema';
import type { ReconstructionResult } from '../analysis/reconstruction';
import type { BehaviorAnalysis } from '../analysis/driverBehavior';
import type { SafetyAudit } from '../analysis/safetyAudit';
import type { AnalysisConclusions } from '../analysis/conclusions';

export type AppScreen = 'selector' | 'input' | 'dashboard';

export interface AnalysisState {
  screen: AppScreen;
  primaryRecord: EdrRecord | null;
  secondaryRecord: EdrRecord | null;
  twoVehicleMode: boolean;
  surface: string;
  speedLimit_kmh: number;
  reconstruction: ReconstructionResult | null;
  behavior: BehaviorAnalysis | null;
  audit: SafetyAudit | null;
  conclusions: AnalysisConclusions | null;
  isAnalyzing: boolean;
  error: string | null;
}

export type AppAction =
  | { type: 'SET_SCREEN'; screen: AppScreen }
  | { type: 'SET_PRIMARY_RECORD'; record: EdrRecord }
  | { type: 'SET_SECONDARY_RECORD'; record: EdrRecord }
  | { type: 'SET_TWO_VEHICLE_MODE'; value: boolean }
  | { type: 'SET_SURFACE'; surface: string }
  | { type: 'SET_SPEED_LIMIT'; limit: number }
  | { type: 'SET_RESULTS'; reconstruction: ReconstructionResult; behavior: BehaviorAnalysis; audit: SafetyAudit; conclusions: AnalysisConclusions }
  | { type: 'SET_ANALYZING'; value: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'RESET' };

export const initialState: AnalysisState = {
  screen: 'selector',
  primaryRecord: null,
  secondaryRecord: null,
  twoVehicleMode: false,
  surface: 'dry_asphalt',
  speedLimit_kmh: 90,
  reconstruction: null,
  behavior: null,
  audit: null,
  conclusions: null,
  isAnalyzing: false,
  error: null,
};

export function reducer(state: AnalysisState, action: AppAction): AnalysisState {
  switch (action.type) {
    case 'SET_SCREEN': return { ...state, screen: action.screen };
    case 'SET_PRIMARY_RECORD': return { ...state, primaryRecord: action.record };
    case 'SET_SECONDARY_RECORD': return { ...state, secondaryRecord: action.record };
    case 'SET_TWO_VEHICLE_MODE': return { ...state, twoVehicleMode: action.value };
    case 'SET_SURFACE': return { ...state, surface: action.surface };
    case 'SET_SPEED_LIMIT': return { ...state, speedLimit_kmh: action.limit };
    case 'SET_RESULTS': return {
      ...state,
      reconstruction: action.reconstruction,
      behavior: action.behavior,
      audit: action.audit,
      conclusions: action.conclusions,
      isAnalyzing: false,
      screen: 'dashboard',
    };
    case 'SET_ANALYZING': return { ...state, isAnalyzing: action.value };
    case 'SET_ERROR': return { ...state, error: action.error, isAnalyzing: false };
    case 'RESET': return { ...initialState };
    default: return state;
  }
}
