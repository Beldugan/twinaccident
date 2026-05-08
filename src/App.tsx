import { AnalysisProvider, useAnalysis } from './store/analysisContext';
import { ScenarioSelector } from './components/ScenarioSelector';
import { InputScreen } from './components/DataInput/InputScreen';
import { Dashboard } from './components/Dashboard/Dashboard';

function AppContent() {
  const { state } = useAnalysis();

  if (state.screen === 'selector') return <ScenarioSelector />;
  if (state.screen === 'input') return <InputScreen />;
  if (state.screen === 'dashboard') return <Dashboard />;
  return <ScenarioSelector />;
}

export default function App() {
  return (
    <AnalysisProvider>
      <AppContent />
    </AnalysisProvider>
  );
}
