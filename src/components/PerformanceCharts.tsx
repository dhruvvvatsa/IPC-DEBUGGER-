// ============================================================
// Performance Charts Component
// Renders message rate, latency, and queue size charts using
// pure SVG. Includes bottleneck detection display.
// ============================================================

import { useStore } from '../store/useStore';

/** Mini sparkline chart drawn with SVG */
function SparkChart({
  data,
  width = 280,
  height = 80,
  color = '#3b82f6',
  fillColor,
  label,
  currentValue,
  unit,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillColor?: string;
  label: string;
  currentValue: string;
  unit: string;
}) {
  if (data.length < 2) {
    return (
      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{label}</span>
          <span className="text-xs text-slate-500">Waiting for data...</span>
        </div>
        <div className="h-20 flex items-center justify-center text-slate-700 text-xs">
          ─── no data ───
        </div>
      </div>
    );
  }

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const padding = 4;

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((v - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const linePath = `M ${points.join(' L ')}`;
  const fillPath = `${linePath} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`;

  return (
    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{label}</span>
        <div className="text-right">
          <span className="text-sm font-bold" style={{ color }}>{currentValue}</span>
          <span className="text-[10px] text-slate-500 ml-1">{unit}</span>
        </div>
      </div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={padding}
            y1={padding + f * (height - padding * 2)}
            x2={width - padding}
            y2={padding + f * (height - padding * 2)}
            stroke="#1e293b"
            strokeWidth={0.5}
          />
        ))}
        {/* Fill area */}
        <path d={fillPath} fill={fillColor || color} opacity={0.1} />
        {/* Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        {/* Current value dot */}
        {data.length > 0 && (
          <>
            <circle
              cx={width - padding}
              cy={height - padding - ((data[data.length - 1] - min) / range) * (height - padding * 2)}
              r={3}
              fill={color}
            />
            <circle
              cx={width - padding}
              cy={height - padding - ((data[data.length - 1] - min) / range) * (height - padding * 2)}
              r={6}
              fill={color}
              opacity={0.2}
            >
              <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" />
            </circle>
          </>
        )}
      </svg>
    </div>
  );
}

export default function PerformanceCharts() {
  const { metrics, channels } = useStore();

  const msgRates = metrics.map((m) => m.messageRate);
  const latencies = metrics.map((m) => m.avgLatency);

  // Queue sizes for each channel over time
  const channelQueueData: Record<string, number[]> = {};
  channels.forEach((c) => {
    if (c.maxQueueSize > 0) {
      channelQueueData[c.id] = metrics.map((m) => m.queueSizes[c.id] ?? 0);
    }
  });

  const latestMetric = metrics[metrics.length - 1];
  const bottlenecks = latestMetric?.bottlenecks || [];
  // Issues related to performance (could be displayed in a future panel)

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          📈 Performance Analysis
        </h2>
        {bottlenecks.length > 0 && (
          <span className="text-[10px] bg-red-900/30 text-red-400 px-2 py-0.5 rounded-full">
            {bottlenecks.length} bottleneck{bottlenecks.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Main charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <SparkChart
          data={msgRates}
          color="#3b82f6"
          label="Message Rate"
          currentValue={latestMetric ? latestMetric.messageRate.toString() : '0'}
          unit="msg/s"
        />
        <SparkChart
          data={latencies}
          color={latestMetric && latestMetric.avgLatency > 50 ? '#ef4444' : '#10b981'}
          label="Average Latency"
          currentValue={latestMetric ? latestMetric.avgLatency.toFixed(1) : '0'}
          unit="ms"
        />
      </div>

      {/* Queue size charts */}
      {Object.keys(channelQueueData).length > 0 && (
        <div>
          <h3 className="text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">Queue Sizes Over Time</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {channels.filter((c) => c.maxQueueSize > 0).map((c) => (
              <SparkChart
                key={c.id}
                data={channelQueueData[c.id] || []}
                color={c.status === 'blocked' ? '#ef4444' : c.status === 'slow' ? '#eab308' : '#06b6d4'}
                label={c.name}
                currentValue={`${c.queueSize}/${c.maxQueueSize}`}
                unit=""
                height={60}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bottleneck alerts */}
      {bottlenecks.length > 0 && (
        <div>
          <h3 className="text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">🔍 Bottlenecks Detected</h3>
          <div className="space-y-2">
            {bottlenecks.map((b, i) => (
              <div key={i} className={`p-2.5 rounded-lg border text-xs ${
                b.severity === 'critical'
                  ? 'bg-red-900/20 border-red-800 text-red-300'
                  : 'bg-yellow-900/20 border-yellow-800 text-yellow-300'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-[10px] uppercase">{b.type.replace('_', ' ')}</span>
                  <span className="text-slate-500">•</span>
                  <span>{channels.find((c) => c.id === b.channelId)?.name}</span>
                </div>
                <p className="text-[11px] opacity-80">{b.description}</p>
                <p className="text-[10px] text-emerald-400 mt-1">💡 {b.suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Channel stats table */}
      <div>
        <h3 className="text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">Channel Statistics</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-slate-500 border-b border-slate-800">
                <th className="text-left py-1.5 font-medium">Channel</th>
                <th className="text-left py-1.5 font-medium">Type</th>
                <th className="text-right py-1.5 font-medium">Status</th>
                <th className="text-right py-1.5 font-medium">Throughput</th>
                <th className="text-right py-1.5 font-medium">Latency</th>
                <th className="text-right py-1.5 font-medium">Total Msgs</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((c) => (
                <tr key={c.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="py-1.5 text-slate-300 font-medium">{c.name}</td>
                  <td className="py-1.5 text-slate-500">{c.type.replace('_', ' ')}</td>
                  <td className="py-1.5 text-right">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                      c.status === 'normal' ? 'bg-emerald-900/30 text-emerald-400' :
                      c.status === 'slow' ? 'bg-yellow-900/30 text-yellow-400' :
                      'bg-red-900/30 text-red-400'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-1.5 text-right text-slate-300">{c.throughput.toFixed(1)} msg/s</td>
                  <td className="py-1.5 text-right text-slate-300">{c.latency.toFixed(1)} ms</td>
                  <td className="py-1.5 text-right text-slate-400">{c.messagesTotal.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
