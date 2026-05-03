// ============================================================
// Inspector Panel — Unified Right Sidebar
// Combines:
//   - Overview (default when nothing selected)
//   - Selection details (when a process/channel is clicked)
//   - Issues / AI suggestions
// ============================================================

import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import type { DetectedIssue } from '../types/ipc';

const SEVERITY_STYLES: Record<string, string> = {
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  error: 'bg-red-500/10 text-red-400 border-red-500/30',
  critical: 'bg-red-500/15 text-red-300 border-red-500/40',
};

type InspectorTab = 'overview' | 'details' | 'issues';

export default function InspectorPanel() {
  const {
    processes, channels, events, issues, deadlocks, metrics, simTick,
    selectedProcessId, selectedChannelId, selectProcess, selectChannel,
    resolveIssue,
  } = useStore();

  const [tab, setTab] = useState<InspectorTab>('overview');

  const selectedProcess = processes.find((p) => p.id === selectedProcessId);
  const selectedChannel = channels.find((c) => c.id === selectedChannelId);
  const hasSelection = selectedProcess || selectedChannel;

  // Auto-switch to "details" tab when something gets selected
  useEffect(() => {
    if (hasSelection) setTab('details');
  }, [selectedProcessId, selectedChannelId]); // eslint-disable-line react-hooks/exhaustive-deps

  const unresolved = issues.filter((i) => !i.resolved);
  const latestMetric = metrics[metrics.length - 1];

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: '📋' },
    { id: 'details' as const, label: 'Details', icon: '⚙️' },
    { id: 'issues' as const, label: 'Issues', icon: '⚠️', badge: unresolved.length },
  ];

  return (
    <div className="h-full flex flex-col rounded-xl overflow-hidden border shadow-2xl"
      style={{ backgroundColor: 'rgba(17, 19, 31, 0.85)', borderColor: '#1f2336', backdropFilter: 'blur(8px)' }}
    >
      {/* Tab bar */}
      <div className="flex border-b shrink-0" style={{ borderColor: '#1f2336' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 text-[11px] font-medium transition-colors relative flex items-center justify-center gap-1.5
              ${tab === t.id ? 'text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}
            style={tab === t.id ? { backgroundColor: 'rgba(24, 27, 42, 0.6)' } : {}}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
            {!!t.badge && t.badge > 0 && (
              <span className="absolute top-1.5 right-3 min-w-[16px] h-4 px-1 text-white text-[9px] font-bold rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #fb7185, #e11d48)' }}
              >
                {t.badge}
              </span>
            )}
            {tab === t.id && (
              <div className="absolute bottom-0 left-3 right-3 h-[2px] rounded-t-full"
                style={{ background: 'linear-gradient(90deg, #818cf8, #c084fc, #22d3ee)' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {tab === 'overview' && (
          <OverviewContent
            processes={processes}
            channels={channels}
            events={events}
            deadlocks={deadlocks}
            unresolvedIssues={unresolved.length}
            latestMetric={latestMetric}
            simTick={simTick}
            onSelectProcess={selectProcess}
          />
        )}

        {tab === 'details' && (
          <DetailsContent
            selectedProcess={selectedProcess}
            selectedChannel={selectedChannel}
            processes={processes}
            channels={channels}
            events={events}
            deadlocks={deadlocks}
            onSelectChannel={selectChannel}
            onSelectProcess={selectProcess}
            onSwitchTab={() => setTab('overview')}
          />
        )}

        {tab === 'issues' && (
          <IssuesContent issues={issues} onResolve={resolveIssue} />
        )}
      </div>
    </div>
  );
}

// ===============================================================
// OVERVIEW CONTENT
// ===============================================================
function OverviewContent({
  processes, channels, events, deadlocks, unresolvedIssues, latestMetric, simTick, onSelectProcess,
}: any) {
  const blockedProcs = processes.filter((p: any) => p.state === 'blocked').length;
  const blockedChans = channels.filter((c: any) => c.status === 'blocked').length;

  const stats = [
    { label: 'Processes', value: processes.length, sub: blockedProcs > 0 ? `${blockedProcs} blocked` : 'all healthy', color: blockedProcs > 0 ? '#fb7185' : '#34d399' },
    { label: 'Channels', value: channels.length, sub: blockedChans > 0 ? `${blockedChans} blocked` : 'all healthy', color: blockedChans > 0 ? '#fb7185' : '#34d399' },
    { label: 'Msg/s', value: latestMetric ? latestMetric.messageRate : 0, sub: 'throughput', color: '#22d3ee' },
    { label: 'Latency', value: latestMetric ? `${latestMetric.avgLatency.toFixed(0)}ms` : '—', sub: 'avg', color: latestMetric && latestMetric.avgLatency > 50 ? '#fb7185' : '#34d399' },
  ];

  return (
    <div className="p-3 space-y-3">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="bg-slate-800/40 rounded-lg p-2.5 border border-slate-700/30">
            <div className="text-[9px] text-slate-500 uppercase tracking-wider font-medium">{s.label}</div>
            <div className="text-lg font-bold mt-0.5" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[9px] text-slate-500">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Sim status */}
      <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/20 rounded-lg p-3 border border-slate-700/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Simulation</span>
          <span className="text-[10px] text-slate-500">tick #{simTick}</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Events recorded</span>
          <span className="font-bold text-slate-200">{events.length}</span>
        </div>
        <div className="flex items-center justify-between text-[11px] mt-1">
          <span className="text-slate-400">Active issues</span>
          <span className={`font-bold ${unresolvedIssues > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {unresolvedIssues || 'none'}
          </span>
        </div>
      </div>

      {/* Deadlock alert */}
      {deadlocks.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-base animate-pulse">🔒</span>
            <span className="text-xs font-bold text-red-400">Deadlock Detected</span>
          </div>
          <p className="text-[10px] text-red-300/80 leading-relaxed">
            {deadlocks[0].explanation}
          </p>
          <div className="mt-2 p-2 bg-slate-900/60 rounded text-[10px]">
            <span className="text-emerald-400 font-medium">💡 Fix: </span>
            <span className="text-slate-300">{deadlocks[0].suggestion}</span>
          </div>
        </div>
      )}

      {/* Process list */}
      <div>
        <h3 className="text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider px-1">
          Processes ({processes.length})
        </h3>
        {processes.length === 0 ? (
          <p className="text-xs text-slate-600 px-1">No processes loaded</p>
        ) : (
          <div className="space-y-1">
            {processes.map((p: any) => (
              <button
                key={p.id}
                onClick={() => onSelectProcess(p.id)}
                className="w-full flex items-center gap-2 bg-slate-800/30 hover:bg-slate-800/70 rounded-md p-2 transition-colors text-left"
              >
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: p.color + '25', color: p.color }}
                >
                  {p.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium text-slate-200 truncate">{p.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      p.state === 'running' ? 'bg-emerald-500' :
                      p.state === 'blocked' ? 'bg-red-500' :
                      p.state === 'waiting' ? 'bg-amber-500' : 'bg-slate-600'
                    }`} />
                    <span className="text-[9px] text-slate-500 uppercase">{p.state}</span>
                    <span className="text-[9px] text-slate-600">·</span>
                    <span className="text-[9px] text-slate-500">{p.cpu}% CPU</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Learning tip */}
      <div className="bg-slate-800/30 rounded-lg p-2.5 border border-slate-700/20">
        <div className="text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">💡 Tip</div>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          Click any process or channel in the graph to see detailed properties and connections.
          Use the <strong className="text-slate-400">Simulation</strong> tab to load preset scenarios.
        </p>
      </div>
    </div>
  );
}

// ===============================================================
// DETAILS CONTENT
// ===============================================================
function DetailsContent({
  selectedProcess, selectedChannel, processes, channels, events, deadlocks,
  onSelectChannel, onSelectProcess, onSwitchTab,
}: any) {
  if (!selectedProcess && !selectedChannel) {
    return (
      <div className="p-6 text-center">
        <div className="text-3xl mb-2 opacity-40">👆</div>
        <p className="text-xs text-slate-400 font-medium">Nothing selected</p>
        <p className="text-[10px] text-slate-600 mt-1 mb-3">
          Click a process or channel in the graph to inspect it
        </p>
        <button
          onClick={onSwitchTab}
          className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-md transition-colors"
        >
          ← Back to Overview
        </button>
      </div>
    );
  }

  if (selectedProcess) {
    const isDL = deadlocks.some((d: any) => d.involvedProcesses.includes(selectedProcess.id));
    const procEvents = events.filter((e: any) => e.processId === selectedProcess.id).slice(-15).reverse();
    const connectedChannels = channels.filter((c: any) =>
      c.sourceId === selectedProcess.id || c.targetId === selectedProcess.id
    );

    return (
      <div className="p-3 space-y-3">
        {/* Header */}
        <div className="text-center pb-3 border-b border-slate-800">
          <div
            className="w-14 h-14 rounded-xl mx-auto mb-2 flex items-center justify-center text-xl font-bold shadow-lg"
            style={{ backgroundColor: selectedProcess.color + '25', color: selectedProcess.color }}
          >
            {selectedProcess.name[0]}
          </div>
          <h3 className="text-sm font-bold text-white">{selectedProcess.name}</h3>
          <p className="text-[10px] text-slate-500 font-mono">PID {selectedProcess.pid}</p>
        </div>

        {/* State + metrics */}
        <div className="space-y-2">
          <PropertyRow label="State" value={selectedProcess.state.toUpperCase()} color={
            selectedProcess.state === 'running' ? '#22c55e' :
            selectedProcess.state === 'blocked' ? '#ef4444' :
            selectedProcess.state === 'waiting' ? '#eab308' : '#6b7280'
          } />
          <div>
            <PropertyRow label="CPU" value={`${selectedProcess.cpu}%`} />
            <ProgressBar value={selectedProcess.cpu} color="#3b82f6" />
          </div>
          <div>
            <PropertyRow label="Memory" value={`${selectedProcess.memory} MB`} />
            <ProgressBar value={selectedProcess.memory} color="#8b5cf6" />
          </div>
        </div>

        {/* Deadlock warning */}
        {isDL && (
          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30">
            <h4 className="text-[10px] font-bold text-red-400 mb-1">🔒 PART OF DEADLOCK</h4>
            <p className="text-[10px] text-red-300/80 leading-relaxed">
              {deadlocks.find((d: any) => d.involvedProcesses.includes(selectedProcess.id))?.explanation}
            </p>
          </div>
        )}

        {/* Connected channels */}
        <div>
          <h4 className="text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
            Channels ({connectedChannels.length})
          </h4>
          {connectedChannels.length === 0 ? (
            <p className="text-[10px] text-slate-600 italic">No connections</p>
          ) : (
            <div className="space-y-1">
              {connectedChannels.map((c: any) => {
                const isOut = c.sourceId === selectedProcess.id;
                const other = processes.find((p: any) =>
                  p.id === (isOut ? c.targetId : c.sourceId)
                );
                return (
                  <button
                    key={c.id}
                    onClick={() => onSelectChannel(c.id)}
                    className="w-full text-left bg-slate-800/40 hover:bg-slate-800 rounded-md p-2 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className={isOut ? 'text-blue-400' : 'text-emerald-400'}>
                        {isOut ? '→' : '←'}
                      </span>
                      <span className="text-slate-200 font-medium">{c.name}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ml-auto ${
                        c.status === 'normal' ? 'bg-emerald-500' :
                        c.status === 'slow' ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5">
                      {isOut ? 'to' : 'from'} {other?.name} · {c.type.replace('_', ' ')}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent events */}
        <div>
          <h4 className="text-[10px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
            Recent Events
          </h4>
          {procEvents.length === 0 ? (
            <p className="text-[10px] text-slate-600 italic">No events yet</p>
          ) : (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {procEvents.map((e: any) => (
                <div key={e.id} className="text-[10px] p-1.5 rounded bg-slate-800/30 border-l-2"
                  style={{ borderLeftColor: e.type === 'send' ? '#3b82f6' : e.type === 'block' ? '#ef4444' : '#10b981' }}
                >
                  <span className="text-slate-300">{e.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Channel details
  if (selectedChannel) {
    const src = processes.find((p: any) => p.id === selectedChannel.sourceId);
    const tgt = processes.find((p: any) => p.id === selectedChannel.targetId);

    return (
      <div className="p-3 space-y-3">
        <div className="text-center pb-3 border-b border-slate-800">
          <div className="text-3xl mb-1">
            {selectedChannel.type === 'pipe' ? '⟿' : selectedChannel.type === 'message_queue' ? '☰' : '▣'}
          </div>
          <h3 className="text-sm font-bold text-white">{selectedChannel.name}</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
            {selectedChannel.type.replace('_', ' ')}
          </p>
        </div>

        {/* Connection */}
        <div className="bg-slate-800/40 rounded-lg p-2.5 border border-slate-700/30">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => onSelectProcess(src?.id)}
              className="flex-1 text-left text-[11px] truncate hover:text-blue-400 transition-colors"
            >
              <div className="text-slate-500 text-[9px] uppercase">Source</div>
              <div className="text-slate-200 font-medium truncate">{src?.name}</div>
            </button>
            <span className="text-blue-400 text-lg">→</span>
            <button
              onClick={() => onSelectProcess(tgt?.id)}
              className="flex-1 text-right text-[11px] truncate hover:text-blue-400 transition-colors"
            >
              <div className="text-slate-500 text-[9px] uppercase">Target</div>
              <div className="text-slate-200 font-medium truncate">{tgt?.name}</div>
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-2">
          <PropertyRow label="Status" value={selectedChannel.status.toUpperCase()} color={
            selectedChannel.status === 'normal' ? '#22c55e' :
            selectedChannel.status === 'slow' ? '#eab308' : '#ef4444'
          } />
          <PropertyRow label="Throughput" value={`${selectedChannel.throughput.toFixed(1)} msg/s`} />
          <PropertyRow label="Latency" value={`${selectedChannel.latency.toFixed(1)} ms`} />
          <PropertyRow label="Total messages" value={selectedChannel.messagesTotal.toLocaleString()} />

          {selectedChannel.maxQueueSize > 0 && (
            <div>
              <PropertyRow label="Queue" value={`${selectedChannel.queueSize} / ${selectedChannel.maxQueueSize}`} />
              <ProgressBar
                value={(selectedChannel.queueSize / selectedChannel.maxQueueSize) * 100}
                color={selectedChannel.queueSize / selectedChannel.maxQueueSize > 0.8 ? '#ef4444' :
                       selectedChannel.queueSize / selectedChannel.maxQueueSize > 0.6 ? '#f59e0b' : '#3b82f6'}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// ===============================================================
// ISSUES CONTENT
// ===============================================================
function IssuesContent({ issues, onResolve }: { issues: DetectedIssue[]; onResolve: (id: string) => void }) {
  const unresolved = issues.filter((i) => !i.resolved);
  const resolved = issues.filter((i) => i.resolved);

  if (issues.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-3xl mb-2">✓</div>
        <p className="text-xs text-emerald-400 font-medium">All clear</p>
        <p className="text-[10px] text-slate-500 mt-1">No issues detected</p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2">
      {unresolved.length > 0 && (
        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider px-1">
          Active ({unresolved.length})
        </div>
      )}
      {unresolved.map((issue) => (
        <div key={issue.id} className={`p-2.5 rounded-lg border ${SEVERITY_STYLES[issue.severity]}`}>
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">
                {issue.severity}
              </span>
              <span className="text-xs font-medium">{issue.title}</span>
            </div>
            <button
              onClick={() => onResolve(issue.id)}
              className="text-[9px] bg-slate-700/60 hover:bg-slate-600 text-slate-300 px-1.5 py-0.5 rounded shrink-0"
            >
              Dismiss
            </button>
          </div>
          <p className="text-[10px] opacity-80 leading-relaxed">{issue.description}</p>
          {issue.suggestion && (
            <div className="mt-2 p-1.5 rounded bg-slate-900/60 text-[10px]">
              <span className="text-emerald-400 font-medium">💡 </span>
              <span className="text-slate-300">{issue.suggestion}</span>
            </div>
          )}
        </div>
      ))}

      {resolved.length > 0 && (
        <>
          <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider px-1 pt-2">
            Resolved ({resolved.length})
          </div>
          {resolved.slice(-5).map((issue) => (
            <div key={issue.id} className="p-2 rounded-lg bg-slate-800/20 border border-slate-800 opacity-50">
              <div className="text-[10px] text-slate-500">✓ {issue.title}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ===============================================================
// HELPERS
// ===============================================================
function PropertyRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-center text-[11px] py-0.5">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold" style={{ color: color || '#e2e8f0' }}>{value}</span>
    </div>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, value)}%`, backgroundColor: color }}
      />
    </div>
  );
}
