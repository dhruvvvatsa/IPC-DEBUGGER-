// ============================================================
// Full Timeline View (expanded page)
// Shows a Gantt-style process execution timeline with
// send/receive events, blocking periods, and delays.
// ============================================================

import { useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import type { EventType } from '../types/ipc';

const EVENT_COLORS: Record<EventType, string> = {
  send: '#3b82f6',
  receive: '#10b981',
  block: '#ef4444',
  unblock: '#22c55e',
  read: '#06b6d4',
  write: '#f59e0b',
  create: '#8b5cf6',
  destroy: '#6b7280',
  delay: '#f97316',
  deadlock: '#ef4444',
  race_condition: '#f59e0b',
};

const EVENT_ICONS: Record<EventType, string> = {
  send: '📤',
  receive: '📥',
  block: '🔒',
  unblock: '🔓',
  read: '👁',
  write: '✏️',
  create: '✨',
  destroy: '💥',
  delay: '⏳',
  deadlock: '🔴',
  race_condition: '⚠️',
};

export default function TimelineView() {
  const { events, processes, channels, simStartTime } = useStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length]);

  const getProcessName = (id: string) =>
    processes.find((p) => p.id === id)?.name || id || 'System';
  const getProcessColor = (id: string) =>
    processes.find((p) => p.id === id)?.color || '#6b7280';
  const getChannelName = (id: string) =>
    channels.find((c) => c.id === id)?.name || '';

  const getRelativeTime = (ts: number) => {
    const diff = ts - simStartTime;
    if (diff < 1000) return `${diff}ms`;
    if (diff < 60000) return `${(diff / 1000).toFixed(1)}s`;
    return `${(diff / 60000).toFixed(1)}m`;
  };

  // Group events by process for Gantt-style view
  const processEvents = processes.map((p) => ({
    process: p,
    events: events.filter((e) => e.processId === p.id || e.targetProcessId === p.id),
  }));

  const recentEvents = events.slice(-200);

  return (
    <div className="h-full flex flex-col gap-3 p-4 overflow-hidden">
      {/* Gantt-style process lanes */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 flex-shrink-0" style={{ maxHeight: '35%' }}>
        <div className="p-2 border-b border-slate-700/50">
          <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Process Execution Lanes
          </h3>
        </div>
        <div className="overflow-x-auto overflow-y-auto p-2" style={{ maxHeight: 'calc(100% - 32px)' }}>
          {processes.length === 0 ? (
            <div className="text-center py-4 text-slate-600 text-xs">No processes to display</div>
          ) : (
            <div className="space-y-1 min-w-[600px]">
              {processEvents.map(({ process, events: pEvents }) => {
                const lastEvents = pEvents.slice(-30);
                return (
                  <div key={process.id} className="flex items-center gap-2 h-8">
                    {/* Process label */}
                    <div className="w-28 shrink-0 flex items-center gap-1.5">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: process.color }}
                      />
                      <span className="text-[10px] text-slate-300 truncate font-medium">
                        {process.name}
                      </span>
                    </div>

                    {/* Event lane */}
                    <div className="flex-1 h-6 bg-slate-900/50 rounded relative overflow-hidden">
                      {/* State background */}
                      <div
                        className="absolute inset-y-0 left-0 right-0 opacity-10 rounded"
                        style={{
                          backgroundColor:
                            process.state === 'running' ? '#22c55e' :
                            process.state === 'blocked' ? '#ef4444' :
                            process.state === 'waiting' ? '#eab308' : '#374151',
                        }}
                      />

                      {/* Event markers */}
                      <div className="absolute inset-0 flex items-center">
                        {lastEvents.map((evt) => (
                          <div
                            key={evt.id}
                            className="h-4 flex items-center justify-center shrink-0"
                            style={{
                              width: `${100 / Math.max(lastEvents.length, 1)}%`,
                            }}
                            title={`${evt.type}: ${evt.description}`}
                          >
                            <div
                              className="w-1.5 h-4 rounded-sm"
                              style={{ backgroundColor: EVENT_COLORS[evt.type] }}
                            />
                          </div>
                        ))}
                      </div>

                      {/* State label */}
                      <div className="absolute right-1 top-0 bottom-0 flex items-center">
                        <span className={`text-[8px] font-bold uppercase ${
                          process.state === 'running' ? 'text-emerald-500' :
                          process.state === 'blocked' ? 'text-red-500' :
                          process.state === 'waiting' ? 'text-yellow-500' : 'text-slate-600'
                        }`}>
                          {process.state}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detailed event log */}
      <div className="flex-1 bg-slate-800/50 rounded-lg border border-slate-700/50 flex flex-col min-h-0 overflow-hidden">
        <div className="p-2 border-b border-slate-700/50 flex items-center justify-between shrink-0">
          <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Event Log ({events.length} total)
          </h3>
          <div className="flex gap-2 text-[8px]">
            {(Object.keys(EVENT_COLORS) as EventType[]).slice(0, 6).map((t) => (
              <div key={t} className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: EVENT_COLORS[t] }} />
                <span className="text-slate-500 capitalize">{t.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
          {recentEvents.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-600 text-xs">
              Waiting for events...
            </div>
          ) : (
            <table className="w-full text-[10px]">
              <thead className="sticky top-0 bg-slate-800/90">
                <tr className="text-slate-500 border-b border-slate-700/50">
                  <th className="text-left py-1.5 px-2 font-medium w-16">Time</th>
                  <th className="text-left py-1.5 px-2 font-medium w-12">Type</th>
                  <th className="text-left py-1.5 px-2 font-medium w-24">Process</th>
                  <th className="text-left py-1.5 px-2 font-medium w-20">Channel</th>
                  <th className="text-left py-1.5 px-2 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((evt) => (
                  <tr
                    key={evt.id}
                    className="border-b border-slate-800/30 hover:bg-slate-700/20 transition-colors"
                  >
                    <td className="py-1 px-2 text-slate-500 font-mono">
                      {getRelativeTime(evt.timestamp)}
                    </td>
                    <td className="py-1 px-2">
                      <span
                        className="px-1 py-0.5 rounded text-[8px] font-bold uppercase"
                        style={{
                          backgroundColor: EVENT_COLORS[evt.type] + '20',
                          color: EVENT_COLORS[evt.type],
                        }}
                      >
                        {EVENT_ICONS[evt.type]} {evt.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-1 px-2">
                      <span className="flex items-center gap-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: getProcessColor(evt.processId) }}
                        />
                        <span className="text-slate-300">{getProcessName(evt.processId)}</span>
                      </span>
                    </td>
                    <td className="py-1 px-2 text-slate-500">
                      {evt.channelId ? getChannelName(evt.channelId) : '—'}
                    </td>
                    <td className="py-1 px-2 text-slate-400 truncate max-w-xs">
                      {evt.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
