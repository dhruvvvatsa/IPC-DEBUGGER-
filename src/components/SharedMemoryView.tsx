// ============================================================
// Shared Memory Visualization Component
// Displays memory segments as a hex grid, highlighting
// concurrent access, race conditions, and process ownership.
// ============================================================

import { useStore } from '../store/useStore';

export default function SharedMemoryView() {
  const { sharedMemory, processes, simConfig } = useStore();

  if (sharedMemory.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8">
        <div className="text-4xl mb-4">▣</div>
        <h3 className="text-sm font-bold text-slate-400 mb-2">No Shared Memory Segments</h3>
        <p className="text-xs text-center max-w-sm">
          {simConfig.scenario === 'race_condition'
            ? 'Start the simulation to see shared memory visualization.'
            : 'Load the "Race Condition" scenario to see shared memory visualization with concurrent read/write detection.'}
        </p>
      </div>
    );
  }

  const getProcessName = (id: string) =>
    processes.find((p) => p.id === id)?.name || id;
  const getProcessColor = (id: string) =>
    processes.find((p) => p.id === id)?.color || '#6b7280';

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      <h2 className="text-sm font-bold text-white flex items-center gap-2">
        ▣ Shared Memory Visualization
      </h2>

      {sharedMemory.map((segment) => (
        <div key={segment.id} className="space-y-4">
          {/* Segment header */}
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-xs font-bold text-white">{segment.name}</h3>
                <p className="text-[10px] text-slate-500 font-mono">{segment.address}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400">Size: {segment.size} bytes</p>
                {segment.hasRaceCondition && (
                  <span className="text-[9px] bg-red-900/40 text-red-400 px-1.5 py-0.5 rounded-full animate-pulse">
                    ⚠ RACE CONDITION
                  </span>
                )}
              </div>
            </div>

            {/* Accessing processes */}
            <div className="flex gap-4 mt-2">
              <div>
                <span className="text-[9px] text-slate-500 uppercase tracking-wider">Writers</span>
                <div className="flex gap-1 mt-0.5">
                  {segment.writers.map((wid) => (
                    <span
                      key={wid}
                      className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                      style={{
                        backgroundColor: getProcessColor(wid) + '20',
                        color: getProcessColor(wid),
                      }}
                    >
                      ✏️ {getProcessName(wid)}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase tracking-wider">Readers</span>
                <div className="flex gap-1 mt-0.5">
                  {segment.readers.map((rid) => (
                    <span
                      key={rid}
                      className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                      style={{
                        backgroundColor: getProcessColor(rid) + '20',
                        color: getProcessColor(rid),
                      }}
                    >
                      👁 {getProcessName(rid)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Memory grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Memory Contents</span>
              <div className="flex gap-3 text-[9px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-500/50"></span> Contested</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500/50"></span> Safe</span>
              </div>
            </div>

            <div className="grid grid-cols-8 gap-1">
              {segment.data.map((cell) => (
                <div
                  key={cell.offset}
                  className={`relative p-1.5 rounded text-center border transition-all duration-300 ${
                    cell.isContested
                      ? 'bg-red-900/30 border-red-800/50 animate-pulse'
                      : 'bg-slate-800/50 border-slate-700/30'
                  }`}
                  title={`Offset: 0x${cell.offset.toString(16).padStart(4, '0')}\nValue: 0x${cell.value.toString(16).padStart(2, '0')} (${cell.value})\nLast Writer: ${getProcessName(cell.lastWriter || '?')}\nLast Read: ${getProcessName(cell.lastRead || '?')}\n${cell.isContested ? '⚠ CONTESTED - Multiple simultaneous access!' : 'Safe'}`}
                >
                  {/* Offset */}
                  <div className="text-[7px] text-slate-600 font-mono mb-0.5">
                    +0x{cell.offset.toString(16).padStart(3, '0')}
                  </div>
                  {/* Value */}
                  <div className={`text-[10px] font-mono font-bold ${cell.isContested ? 'text-red-400' : 'text-slate-300'}`}>
                    {cell.value.toString(16).padStart(2, '0').toUpperCase()}
                  </div>
                  {/* Writer indicator */}
                  {cell.lastWriter && (
                    <div
                      className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: getProcessColor(cell.lastWriter) }}
                    />
                  )}
                  {/* Contest indicator */}
                  {cell.isContested && (
                    <div className="absolute -top-0.5 -right-0.5">
                      <span className="text-[8px]">⚠</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Race condition explanation */}
          {segment.hasRaceCondition && (
            <div className="bg-red-900/15 border border-red-900/30 rounded-lg p-3">
              <h4 className="text-[10px] font-bold text-red-400 mb-1">⚠ Race Condition Detected</h4>
              <p className="text-[10px] text-red-300/70 leading-relaxed">
                Multiple processes are writing to the same memory region simultaneously without synchronization.
                Writers <strong>{segment.writers.map(getProcessName).join(', ')}</strong> are both modifying
                contested cells, which may lead to data corruption.
              </p>
              <div className="mt-2 p-2 bg-slate-800/50 rounded text-[10px]">
                <span className="text-emerald-400 font-medium">💡 Suggestion: </span>
                <span className="text-slate-300">
                  Add a mutex or semaphore to synchronize access. Use <code className="text-blue-400">pthread_mutex_lock()</code> before
                  writing and <code className="text-blue-400">pthread_mutex_unlock()</code> after.
                </span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
