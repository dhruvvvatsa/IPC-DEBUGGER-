// ============================================================
// Header / Navigation Bar Component
// Clean three-section header: Logo | Navigation | Status
// ============================================================

import { useStore } from '../store/useStore';
import type { MainView } from '../types/ipc';

const NAV_ITEMS: { id: MainView; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'timeline', label: 'Timeline', icon: '⏱' },
  { id: 'memory', label: 'Memory', icon: '▣' },
  { id: 'performance', label: 'Performance', icon: '📈' },
  { id: 'simulation', label: 'Simulation', icon: '🎮' },
];

export default function Header() {
  const {
    mainView, setMainView,
    simState, simTick, simConfig,
    deadlocks, issues,
    startSimulation, pauseSimulation, resetSimulation, setSimSpeed,
  } = useStore();

  const unresolvedIssues = issues.filter((i) => !i.resolved).length;

  return (
    <header className="shrink-0 backdrop-blur-xl border-b" style={{ backgroundColor: 'rgba(17, 19, 31, 0.85)', borderColor: '#1f2336' }}>
      {/* Top Row: Logo + Status */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b" style={{ borderColor: 'rgba(31, 35, 54, 0.6)' }}>
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-base font-bold shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #818cf8 0%, #a855f7 50%, #22d3ee 100%)',
                boxShadow: '0 4px 24px -6px rgba(129, 140, 248, 0.5)',
              }}
            >
              ⟡
            </div>
            <div className="absolute inset-0 rounded-xl opacity-40 blur-md"
              style={{ background: 'linear-gradient(135deg, #818cf8, #a855f7)' }}
            />
          </div>
          <div className="relative">
            <h1 className="text-sm font-bold text-slate-100 leading-tight tracking-tight">IPC Debugger</h1>
            <p className="text-[10px] text-slate-500 leading-tight">Inter-Process Communication Visualizer</p>
          </div>
        </div>

        {/* Right: Sim Controls + Status */}
        <div className="flex items-center gap-3">
          {/* Issue badge */}
          {unresolvedIssues > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium border"
              style={{ backgroundColor: 'rgba(251, 113, 133, 0.1)', color: '#fb7185', borderColor: 'rgba(251, 113, 133, 0.3)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#fb7185' }} />
              {deadlocks.length > 0 && <span>🔒 {deadlocks.length} Deadlock</span>}
              {deadlocks.length === 0 && <span>⚠ {unresolvedIssues} Issues</span>}
            </div>
          )}

          {/* Speed selector */}
          <div className="hidden md:flex items-center gap-0.5 rounded-md p-0.5 border" style={{ backgroundColor: 'rgba(24, 27, 42, 0.8)', borderColor: '#1f2336' }}>
            {[0.5, 1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => setSimSpeed(s)}
                className={`text-[10px] px-2 py-1 rounded transition-all font-medium ${
                  simConfig.speed === s
                    ? 'text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                style={simConfig.speed === s ? { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' } : {}}
              >
                {s}×
              </button>
            ))}
          </div>

          {/* Sim controls */}
          <div className="flex items-center gap-1">
            {simState !== 'running' ? (
              <button
                onClick={startSimulation}
                className="flex items-center gap-1.5 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-all shadow-md hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  boxShadow: '0 2px 12px -2px rgba(16, 185, 129, 0.4)',
                }}
              >
                ▶ {simState === 'paused' ? 'Resume' : 'Start'}
              </button>
            ) : (
              <button
                onClick={pauseSimulation}
                className="flex items-center gap-1.5 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-all shadow-md hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  boxShadow: '0 2px 12px -2px rgba(245, 158, 11, 0.4)',
                }}
              >
                ⏸ Pause
              </button>
            )}
            <button
              onClick={resetSimulation}
              className="text-slate-300 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors border"
              style={{ backgroundColor: 'rgba(24, 27, 42, 0.6)', borderColor: '#1f2336' }}
              title="Reset simulation"
            >
              ↺
            </button>
          </div>

          {/* Tick counter */}
          <div className={`hidden lg:flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-md border`}
            style={
              simState === 'running'
                ? { backgroundColor: 'rgba(52, 211, 153, 0.1)', color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.3)' }
                : simState === 'paused'
                ? { backgroundColor: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', borderColor: 'rgba(251, 191, 36, 0.3)' }
                : { backgroundColor: 'rgba(24, 27, 42, 0.6)', color: '#9095a8', borderColor: '#1f2336' }
            }
          >
            <div className={`w-1.5 h-1.5 rounded-full ${simState === 'running' ? 'animate-pulse' : ''}`}
              style={{
                backgroundColor: simState === 'running' ? '#34d399' : simState === 'paused' ? '#fbbf24' : '#5a607a',
              }}
            />
            <span className="uppercase font-semibold tracking-wider">{simState}</span>
            <span className="opacity-50">·</span>
            <span>tick #{simTick}</span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Navigation tabs */}
      <nav className="flex items-center px-5">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setMainView(item.id)}
            className={`relative px-4 py-2.5 text-xs font-medium transition-colors flex items-center gap-2
              ${mainView === item.id ? 'text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <span className="text-sm">{item.icon}</span>
            <span>{item.label}</span>
            {mainView === item.id && (
              <div className="absolute bottom-0 left-2 right-2 h-[2px] rounded-t-full"
                style={{ background: 'linear-gradient(90deg, #818cf8, #c084fc, #22d3ee)' }}
              />
            )}
            {item.id === 'dashboard' && deadlocks.length > 0 && (
              <span className="ml-1 w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#fb7185' }} />
            )}
          </button>
        ))}
      </nav>
    </header>
  );
}
