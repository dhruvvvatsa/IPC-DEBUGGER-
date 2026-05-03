// ============================================================
// Process Graph Visualization
// Renders processes as draggable nodes and IPC channels as
// animated connections. Supports zoom/pan, data flow animation,
// and deadlock cycle highlighting.
// ============================================================

import { useRef, useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import type { Process, IPCChannel, ChannelStatus } from '../types/ipc';

/** Map channel status to CSS color (Aurora palette) */
const STATUS_COLORS: Record<ChannelStatus, string> = {
  normal: '#34d399',   // emerald-400
  slow: '#fbbf24',     // amber-400
  blocked: '#fb7185',  // rose-400
};

/** Map process state to CSS color (Aurora palette) */
const STATE_COLORS: Record<string, string> = {
  running: '#34d399',
  blocked: '#fb7185',
  waiting: '#fbbf24',
  idle: '#5a607a',
  terminated: '#2a2f44',
};

/** IPC type icons/labels */
const TYPE_LABELS: Record<string, string> = {
  pipe: '⟿',
  message_queue: '☰',
  shared_memory: '▣',
};

export default function ProcessGraph() {
  const {
    processes, channels, packets, deadlocks,
    selectProcess, selectChannel, selectedProcessId, selectedChannelId,
    updateProcessPosition, simState,
  } = useStore();

  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 800, h: 550 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const scale = e.deltaY > 0 ? 1.1 : 0.9;
    setViewBox((v) => ({
      x: v.x,
      y: v.y,
      w: v.w * scale,
      h: v.h * scale,
    }));
  }, []);

  // Get SVG coordinates from mouse event
  const getSvgPoint = useCallback((e: React.MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: viewBox.x + ((e.clientX - rect.left) / rect.width) * viewBox.w,
      y: viewBox.y + ((e.clientY - rect.top) / rect.height) * viewBox.h,
    };
  }, [viewBox]);

  const handleMouseDown = useCallback((e: React.MouseEvent, processId?: string) => {
    if (processId) {
      e.stopPropagation();
      const pt = getSvgPoint(e);
      const proc = processes.find((p) => p.id === processId);
      if (proc) {
        setDragging(processId);
        setDragOffset({ x: pt.x - proc.x, y: pt.y - proc.y });
      }
    } else {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, [getSvgPoint, processes]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging) {
      const pt = getSvgPoint(e);
      updateProcessPosition(dragging, pt.x - dragOffset.x, pt.y - dragOffset.y);
    } else if (isPanning) {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const dx = ((e.clientX - panStart.x) / rect.width) * viewBox.w;
      const dy = ((e.clientY - panStart.y) / rect.height) * viewBox.h;
      setViewBox((v) => ({ ...v, x: v.x - dx, y: v.y - dy }));
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, [dragging, dragOffset, getSvgPoint, isPanning, panStart, viewBox, updateProcessPosition]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setIsPanning(false);
  }, []);

  // Check if a process is involved in a deadlock
  const isDeadlocked = (pid: string) => deadlocks.some((d) => d.involvedProcesses.includes(pid));
  const isDeadlockedChannel = (cid: string) => deadlocks.some((d) => d.involvedChannels.includes(cid));

  // Render a channel connection line
  const renderChannel = (channel: IPCChannel) => {
    const source = processes.find((p) => p.id === channel.sourceId);
    const target = processes.find((p) => p.id === channel.targetId);
    if (!source || !target) return null;

    const isSelected = selectedChannelId === channel.id;
    const isDL = isDeadlockedChannel(channel.id);
    const color = isDL ? '#ef4444' : STATUS_COLORS[channel.status];

    // Calculate curve control point
    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2;
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const perpX = -dy * 0.15;
    const perpY = dx * 0.15;

    const path = `M ${source.x} ${source.y} Q ${midX + perpX} ${midY + perpY} ${target.x} ${target.y}`;

    // Find packets on this channel
    const channelPackets = packets.filter((p) => p.channelId === channel.id);

    return (
      <g key={channel.id}>
        {/* Invisible wider hit area for clicking */}
        <path
          d={path}
          fill="none"
          stroke="transparent"
          strokeWidth={16}
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); selectChannel(channel.id); }}
        />
        {/* Visible channel line */}
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={isSelected ? 3 : 2}
          strokeDasharray={channel.status === 'blocked' ? '8,4' : channel.type === 'shared_memory' ? '4,2' : 'none'}
          opacity={isSelected ? 1 : 0.7}
          markerEnd="url(#arrowhead)"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); selectChannel(channel.id); }}
        >
          {isDL && (
            <animate attributeName="stroke" values="#ef4444;#fbbf24;#ef4444" dur="1s" repeatCount="indefinite" />
          )}
        </path>

        {/* Channel type label */}
        <text
          x={midX + perpX}
          y={midY + perpY - 8}
          textAnchor="middle"
          fill="#9ca3af"
          fontSize={10}
          style={{ pointerEvents: 'none' }}
        >
          {TYPE_LABELS[channel.type]} {channel.name}
        </text>

        {/* Throughput label */}
        <text
          x={midX + perpX}
          y={midY + perpY + 10}
          textAnchor="middle"
          fill="#6b7280"
          fontSize={8}
          style={{ pointerEvents: 'none' }}
        >
          {channel.throughput.toFixed(0)} msg/s | {channel.latency.toFixed(0)}ms
        </text>

        {/* Animated data packets */}
        {channelPackets.map((pkt) => {
          const t = pkt.progress;
          // Quadratic bezier interpolation
          const cx = midX + perpX;
          const cy = midY + perpY;
          const px = (1 - t) * (1 - t) * source.x + 2 * (1 - t) * t * cx + t * t * target.x;
          const py = (1 - t) * (1 - t) * source.y + 2 * (1 - t) * t * cy + t * t * target.y;

          return (
            <g key={pkt.id}>
              <circle cx={px} cy={py} r={5} fill={pkt.color} opacity={0.9}>
                <animate attributeName="r" values="4;6;4" dur="0.5s" repeatCount="indefinite" />
              </circle>
              <circle cx={px} cy={py} r={8} fill={pkt.color} opacity={0.2}>
                <animate attributeName="r" values="6;12;6" dur="0.5s" repeatCount="indefinite" />
              </circle>
            </g>
          );
        })}
      </g>
    );
  };

  // Render a process node
  const renderProcess = (process: Process) => {
    const isSelected = selectedProcessId === process.id;
    const isDL = isDeadlocked(process.id);
    const stateColor = isDL ? '#ef4444' : STATE_COLORS[process.state] || '#6b7280';
    const pulseActive = simState === 'running' && (process.state === 'running' || isDL);

    return (
      <g
        key={process.id}
        transform={`translate(${process.x}, ${process.y})`}
        style={{ cursor: dragging === process.id ? 'grabbing' : 'grab' }}
        onMouseDown={(e) => handleMouseDown(e, process.id)}
        onClick={(e) => { e.stopPropagation(); selectProcess(process.id); }}
      >
        {/* Selection ring */}
        {isSelected && (
          <circle r={38} fill="none" stroke="#818cf8" strokeWidth={2} strokeDasharray="4,2">
            <animate attributeName="stroke-dashoffset" from="0" to="12" dur="1s" repeatCount="indefinite" />
          </circle>
        )}

        {/* Deadlock pulse */}
        {isDL && (
          <circle r={40} fill="none" stroke="#ef4444" strokeWidth={2} opacity={0.5}>
            <animate attributeName="r" values="35;50;35" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0;0.6" dur="1.5s" repeatCount="indefinite" />
          </circle>
        )}

        {/* Background glow */}
        {pulseActive && (
          <circle r={35} fill={stateColor} opacity={0.15}>
            <animate attributeName="r" values="32;38;32" dur="2s" repeatCount="indefinite" />
          </circle>
        )}

        {/* Main circle */}
        <circle
          r={28}
          fill="#181b2a"
          stroke={stateColor}
          strokeWidth={isSelected ? 3 : 2}
        />

        {/* CPU usage arc */}
        {process.cpu > 0 && (
          <circle
            r={24}
            fill="none"
            stroke={process.color}
            strokeWidth={3}
            strokeDasharray={`${process.cpu * 1.5} ${150 - process.cpu * 1.5}`}
            strokeLinecap="round"
            transform="rotate(-90)"
            opacity={0.6}
          />
        )}

        {/* Process name */}
        <text
          textAnchor="middle"
          fill="white"
          fontSize={9}
          fontWeight="bold"
          dy={-4}
          style={{ pointerEvents: 'none' }}
        >
          {process.name.length > 12 ? process.name.slice(0, 11) + '…' : process.name}
        </text>

        {/* PID */}
        <text
          textAnchor="middle"
          fill="#94a3b8"
          fontSize={7}
          dy={7}
          style={{ pointerEvents: 'none' }}
        >
          PID {process.pid}
        </text>

        {/* State badge */}
        <g transform="translate(18, -22)">
          <circle r={6} fill={stateColor} />
          {process.state === 'running' && (
            <circle r={6} fill={stateColor} opacity={0.5}>
              <animate attributeName="r" values="6;10;6" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0;0.5" dur="1.5s" repeatCount="indefinite" />
            </circle>
          )}
        </g>

        {/* State label */}
        <text
          textAnchor="middle"
          fill={stateColor}
          fontSize={7}
          dy={18}
          style={{ pointerEvents: 'none' }}
        >
          {isDL ? '🔒 DEADLOCK' : process.state.toUpperCase()}
        </text>
      </g>
    );
  };

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl border"
      style={{
        background: 'linear-gradient(135deg, #11131f 0%, #0a0b14 100%)',
        borderColor: '#1f2336',
      }}
    >
      {/* Header */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-slate-900/90 backdrop-blur px-2.5 py-1.5 rounded-md border border-slate-700/50 shadow">
          <span>📊</span>
          <span>Process Graph</span>
          <span className="text-slate-600 mx-1">·</span>
          <span className="text-slate-500 font-normal">{processes.length} nodes</span>
        </div>
        {deadlocks.length > 0 && (
          <span className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-2.5 py-1.5 rounded-md animate-pulse">
            🔒 {deadlocks.length} Deadlock{deadlocks.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Legend */}
      <div className="absolute top-3 right-3 z-10 flex gap-3 bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-md text-[10px] border border-slate-700/50 shadow">
        {Object.entries(STATE_COLORS).slice(0, 4).map(([state, color]) => (
          <div key={state} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-slate-400 capitalize">{state}</span>
          </div>
        ))}
      </div>

      {/* Help hint at bottom-left */}
      <div className="absolute bottom-3 left-3 z-10 text-[9px] text-slate-600 bg-slate-900/60 backdrop-blur px-2 py-1 rounded border border-slate-800">
        🖱 Drag nodes · Scroll to zoom · Drag canvas to pan
      </div>

      {/* Process count */}
      {processes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-500 text-sm">No processes yet</p>
            <p className="text-slate-600 text-xs mt-1">Load a scenario or add processes in Simulation mode</p>
          </div>
        </div>
      )}

      <svg
        ref={svgRef}
        className="w-full h-full"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        onWheel={handleWheel}
        onMouseDown={(e) => handleMouseDown(e)}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={() => { selectProcess(null); selectChannel(null); }}
      >
        <defs>
          {/* Arrow marker for channel direction */}
          <marker id="arrowhead" viewBox="0 0 10 7" refX="10" refY="3.5" markerWidth="8" markerHeight="6" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
          </marker>
          {/* Grid pattern */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1f2336" strokeWidth="0.5" />
          </pattern>
        </defs>

        {/* Grid background */}
        <rect x={viewBox.x - 200} y={viewBox.y - 200} width={viewBox.w + 400} height={viewBox.h + 400} fill="url(#grid)" />

        {/* Render channels first (behind nodes) */}
        {channels.map(renderChannel)}

        {/* Render process nodes on top */}
        {processes.map(renderProcess)}
      </svg>
    </div>
  );
}
