// ============================================================
// Timeline View Component
// Displays an execution timeline of all IPC events with
// color-coded event types, process labels, and timing info.
// ============================================================

import { useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import type { EventType } from '../types/ipc';

/** Color mapping for event types */
const EVENT_COLORS: Record<EventType, string> = {
  send: '#818cf8',         // indigo
  receive: '#34d399',      // emerald
  block: '#fb7185',        // rose
  unblock: '#34d399',
  read: '#22d3ee',         // cyan
  write: '#fbbf24',        // amber
  create: '#c084fc',       // violet
  destroy: '#5a607a',
  delay: '#fb923c',        // orange
  deadlock: '#fb7185',
  race_condition: '#fbbf24',
};

/** Emoji for event types */
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

export default function Timeline() {
  const { events, processes, simStartTime } = useStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new events appear
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length]);

  const getProcessName = (id: string) =>
    processes.find((p) => p.id === id)?.name || id || 'System';

  const getRelativeTime = (ts: number) => {
    const diff = ts - simStartTime;
    if (diff < 1000) return `${diff}ms`;
    return `${(diff / 1000).toFixed(1)}s`;
  };

  const recentEvents = events.slice(-100);

  return (
    <div className="h-full flex flex-col rounded-xl overflow-hidden border shadow-2xl"
      style={{ backgroundColor: 'rgba(17, 19, 31, 0.85)', borderColor: '#1f2336', backdropFilter: 'blur(8px)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">⏱ Timeline</span>
          <span className="text-[10px] text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">
            {events.length} events
          </span>
        </div>
        <div className="flex gap-2 text-[9px]">
          {(['send', 'receive', 'block', 'deadlock', 'race_condition'] as EventType[]).map((t) => (
            <div key={t} className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: EVENT_COLORS[t] }} />
              <span className="text-slate-500 capitalize">{t.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Event list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        {recentEvents.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-600 text-xs">
            No events yet. Start a simulation to see events.
          </div>
        ) : (
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-[62px] top-0 bottom-0 w-px bg-slate-800" />

            {recentEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-2 px-3 py-1.5 hover:bg-slate-800/50 transition-colors group text-xs"
              >
                {/* Timestamp */}
                <div className="w-12 text-right shrink-0 text-slate-600 font-mono text-[10px] pt-0.5">
                  {getRelativeTime(event.timestamp)}
                </div>

                {/* Dot on timeline */}
                <div className="relative shrink-0 flex items-center justify-center w-4 mt-0.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full z-10"
                    style={{ backgroundColor: EVENT_COLORS[event.type] }}
                  />
                  {(event.type === 'deadlock' || event.type === 'race_condition') && (
                    <div
                      className="absolute w-4 h-4 rounded-full animate-ping"
                      style={{ backgroundColor: EVENT_COLORS[event.type], opacity: 0.3 }}
                    />
                  )}
                </div>

                {/* Event content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span>{EVENT_ICONS[event.type]}</span>
                    <span className="font-medium text-slate-300">
                      {getProcessName(event.processId)}
                    </span>
                    <span
                      className="text-[9px] px-1 py-0.5 rounded font-medium"
                      style={{
                        backgroundColor: EVENT_COLORS[event.type] + '20',
                        color: EVENT_COLORS[event.type],
                      }}
                    >
                      {event.type.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5 truncate">
                    {event.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
