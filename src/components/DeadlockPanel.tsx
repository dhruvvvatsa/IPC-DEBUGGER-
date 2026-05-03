// ============================================================
// Deadlock Detection Panel
// Shows detected deadlocks with cycle visualization,
// explanations, and AI-based fix suggestions.
// ============================================================

import { useStore } from '../store/useStore';

export default function DeadlockPanel() {
  const { deadlocks, processes, channels } = useStore();

  const getProcessName = (id: string) =>
    processes.find((p) => p.id === id)?.name || id;
  const getProcessColor = (id: string) =>
    processes.find((p) => p.id === id)?.color || '#6b7280';

  if (deadlocks.length === 0) {
    return (
      <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-emerald-500">✓</span>
          <span className="text-[11px] font-medium text-emerald-400">No Deadlocks Detected</span>
        </div>
        <p className="text-[10px] text-slate-500">
          The wait-for graph analysis found no circular dependencies.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {deadlocks.map((dl) => (
        <div key={dl.id} className="bg-red-900/15 rounded-lg p-3 border border-red-900/30">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg animate-pulse">🔒</span>
            <div>
              <h4 className="text-xs font-bold text-red-400">Deadlock Detected</h4>
              <p className="text-[9px] text-red-300/60">
                {new Date(dl.detectedAt).toLocaleTimeString()} •{' '}
                {dl.involvedProcesses.length} processes involved
              </p>
            </div>
          </div>

          {/* Cycle visualization */}
          <div className="bg-slate-900/50 rounded-lg p-2 mb-2">
            <p className="text-[9px] text-slate-500 mb-1.5 uppercase tracking-wider font-medium">Wait-For Cycle</p>
            <div className="flex items-center flex-wrap gap-1">
              {dl.cycle.map((pid, idx) => (
                <div key={`${pid}-${idx}`} className="flex items-center gap-1">
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium border"
                    style={{
                      backgroundColor: getProcessColor(pid) + '15',
                      borderColor: getProcessColor(pid) + '40',
                      color: getProcessColor(pid),
                    }}
                  >
                    {getProcessName(pid)}
                  </span>
                  <span className="text-red-500 text-xs">→</span>
                </div>
              ))}
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium border"
                style={{
                  backgroundColor: getProcessColor(dl.cycle[0]) + '15',
                  borderColor: getProcessColor(dl.cycle[0]) + '40',
                  color: getProcessColor(dl.cycle[0]),
                }}
              >
                {getProcessName(dl.cycle[0])}
              </span>
              <span className="text-[9px] text-red-400 ml-1">(cycle)</span>
            </div>
          </div>

          {/* Explanation */}
          <div className="mb-2">
            <p className="text-[10px] text-red-300/80 leading-relaxed">{dl.explanation}</p>
          </div>

          {/* Channels involved */}
          <div className="mb-2">
            <p className="text-[9px] text-slate-500 mb-1 uppercase tracking-wider font-medium">Blocked Channels</p>
            <div className="flex flex-wrap gap-1">
              {dl.involvedChannels.map((cid) => {
                const ch = channels.find((c) => c.id === cid);
                return (
                  <span key={cid} className="text-[9px] bg-red-900/30 text-red-300 px-1.5 py-0.5 rounded">
                    {ch?.name || cid}
                  </span>
                );
              })}
            </div>
          </div>

          {/* AI Suggestion */}
          <div className="bg-emerald-900/15 border border-emerald-900/30 rounded p-2">
            <p className="text-[9px] text-emerald-400 font-medium mb-0.5">🤖 AI Fix Suggestion</p>
            <p className="text-[10px] text-emerald-300/80 leading-relaxed">{dl.suggestion}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
