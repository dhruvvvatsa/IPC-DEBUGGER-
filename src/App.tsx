// ============================================================
// IPC Debugger - Main Application Component
// Clean three-zone layout (consistent across all views):
//   Top:    Header (logo + nav + sim controls)
//   Left:   Main view content (graph/timeline/memory/etc.)
//   Right:  Unified Inspector sidebar (overview/details/issues)
//   Bottom: Mini timeline strip (dashboard only)
// ============================================================

import { useEffect, useRef, useCallback } from 'react';
import { useStore } from './store/useStore';
import Header from './components/Header';
import ProcessGraph from './components/ProcessGraph';
import Timeline from './components/Timeline';
import InspectorPanel from './components/InspectorPanel';
import TimelineView from './components/TimelineView';
import SharedMemoryView from './components/SharedMemoryView';
import PerformanceCharts from './components/PerformanceCharts';
import SimulationPanel from './components/SimulationPanel';

export default function App() {
  const {
    mainView, simState, simConfig, tick,
    loadScenario, processes,
  } = useStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasInitRef = useRef(false);

  // Auto-load default scenario on first render
  useEffect(() => {
    if (!hasInitRef.current && processes.length === 0) {
      hasInitRef.current = true;
      loadScenario('producer_consumer');
    }
  }, [loadScenario, processes.length]);

  // Simulation loop
  const startLoop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const ms = Math.max(50, Math.round(500 / simConfig.speed));
    intervalRef.current = setInterval(() => { tick(); }, ms);
  }, [simConfig.speed, tick]);

  const stopLoop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (simState === 'running') startLoop();
    else stopLoop();
    return stopLoop;
  }, [simState, startLoop, stopLoop]);

  // Render the main central content area for the current view.
  // Process graph already has its own card styling; wrap others in a matching surface.
  const renderMainView = () => {
    if (mainView === 'dashboard') return <ProcessGraph />;

    const inner =
      mainView === 'timeline'    ? <TimelineView /> :
      mainView === 'memory'      ? <SharedMemoryView /> :
      mainView === 'performance' ? <PerformanceCharts /> :
      mainView === 'simulation'  ? <SimulationPanel /> :
      null;

    return (
      <div className="h-full rounded-xl overflow-hidden border shadow-2xl"
        style={{
          backgroundColor: 'rgba(17, 19, 31, 0.85)',
          borderColor: '#1f2336',
          backdropFilter: 'blur(8px)',
        }}
      >
        {inner}
      </div>
    );
  };

  // Show timeline strip only on dashboard (other views have their own bottom content)
  const showTimelineStrip = mainView === 'dashboard';

  return (
    <div className="h-screen w-screen flex flex-col text-slate-100 overflow-hidden" style={{ backgroundColor: '#0a0b14' }}>
      {/* Aurora ambient lighting — subtle multi-color gradient */}
      <div className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 1000px 600px at 0% 0%, rgba(129, 140, 248, 0.10), transparent 55%),
            radial-gradient(ellipse 800px 500px at 100% 0%, rgba(34, 211, 238, 0.07), transparent 55%),
            radial-gradient(ellipse 900px 600px at 50% 100%, rgba(192, 132, 252, 0.06), transparent 55%)
          `,
        }}
      />
      {/* Subtle grid texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Header */}
      <Header />

      {/* Main 3-zone layout */}
      <div className="flex-1 flex flex-col min-h-0 relative z-10">
        <div className="flex-1 flex gap-3 p-3 min-h-0">
          {/* LEFT: Main view */}
          <main className="flex-1 min-w-0">
            {renderMainView()}
          </main>

          {/* RIGHT: Unified inspector */}
          <aside className="w-[320px] xl:w-[360px] shrink-0">
            <InspectorPanel />
          </aside>
        </div>

        {/* BOTTOM: Timeline strip (dashboard only) */}
        {showTimelineStrip && (
          <div className="px-3 pb-3 shrink-0">
            <div className="h-[180px]">
              <Timeline />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
