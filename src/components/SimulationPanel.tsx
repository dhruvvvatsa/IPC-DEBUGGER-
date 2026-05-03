// ============================================================
// Simulation Control Panel
// Allows users to create processes, define IPC behavior,
// load pre-built scenarios, and control simulation execution.
// ============================================================

import { useState } from 'react';
import { useStore } from '../store/useStore';
import { scenarios } from '../data/scenarios';
import type { ScenarioType, IPCType } from '../types/ipc';

export default function SimulationPanel() {
  const {
    processes, channels, simState, simConfig,
    addProcess, removeProcess, addChannel, removeChannel,
    loadScenario, startSimulation, pauseSimulation, resetSimulation,
    stepSimulation, setSimSpeed, exportLogs,
  } = useStore();

  const [newProcessName, setNewProcessName] = useState('');
  const [channelSource, setChannelSource] = useState('');
  const [channelTarget, setChannelTarget] = useState('');
  const [channelType, setChannelType] = useState<IPCType>('pipe');
  const [channelName, setChannelName] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [exportData, setExportData] = useState('');

  const handleAddProcess = () => {
    if (newProcessName.trim()) {
      addProcess(newProcessName.trim());
      setNewProcessName('');
    }
  };

  const handleAddChannel = () => {
    if (channelSource && channelTarget && channelSource !== channelTarget) {
      addChannel(channelSource, channelTarget, channelType, channelName || undefined);
      setChannelName('');
    }
  };

  const handleExport = () => {
    const json = exportLogs();
    setExportData(json);
    setShowExport(true);
  };

  const handleDownload = () => {
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ipc-debug-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-5">
      <h2 className="text-sm font-bold text-white flex items-center gap-2">
        🎮 Simulation Control
      </h2>

      {/* ---- Scenario Selection ---- */}
      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
        <h3 className="text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">Load Scenario</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {(Object.keys(scenarios) as ScenarioType[]).map((key) => (
            <button
              key={key}
              onClick={() => loadScenario(key)}
              className={`text-left p-2 rounded-lg border text-[11px] transition-all ${
                simConfig.scenario === key
                  ? 'bg-blue-900/30 border-blue-700 text-blue-300'
                  : 'bg-slate-800/30 border-slate-700/30 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300'
              }`}
            >
              <div className="font-medium">{scenarios[key].name}</div>
              <div className="text-[9px] opacity-60 mt-0.5 line-clamp-2">{scenarios[key].description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ---- Simulation Controls ---- */}
      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
        <h3 className="text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">Controls</h3>

        <div className="flex gap-1.5 mb-3">
          {simState !== 'running' ? (
            <button
              onClick={startSimulation}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-2 rounded-lg font-medium transition-colors"
            >
              ▶ {simState === 'paused' ? 'Resume' : 'Start'}
            </button>
          ) : (
            <button
              onClick={pauseSimulation}
              className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white text-xs py-2 rounded-lg font-medium transition-colors"
            >
              ⏸ Pause
            </button>
          )}
          <button
            onClick={stepSimulation}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs py-2 px-3 rounded-lg font-medium transition-colors"
            title="Step forward one tick"
          >
            ⏭ Step
          </button>
          <button
            onClick={resetSimulation}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs py-2 px-3 rounded-lg font-medium transition-colors"
          >
            ↺ Reset
          </button>
        </div>

        {/* Speed control */}
        <div>
          <span className="text-[10px] text-slate-500">Speed</span>
          <div className="flex gap-1 mt-1">
            {[0.5, 1, 2, 4].map((speed) => (
              <button
                key={speed}
                onClick={() => setSimSpeed(speed)}
                className={`flex-1 text-[10px] py-1 rounded transition-colors ${
                  simConfig.speed === speed
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="mt-3 flex items-center gap-2 text-[10px]">
          <div className={`w-2 h-2 rounded-full ${
            simState === 'running' ? 'bg-emerald-500 animate-pulse' :
            simState === 'paused' ? 'bg-yellow-500' : 'bg-slate-600'
          }`} />
          <span className="text-slate-400 uppercase font-medium">{simState}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-500">Tick #{useStore.getState().simTick}</span>
        </div>
      </div>

      {/* ---- Add Process ---- */}
      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
        <h3 className="text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">Add Process</h3>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={newProcessName}
            onChange={(e) => setNewProcessName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddProcess()}
            placeholder="Process name..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-600"
          />
          <button
            onClick={handleAddProcess}
            disabled={!newProcessName.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-600 text-white text-xs px-3 rounded-lg font-medium transition-colors"
          >
            + Add
          </button>
        </div>

        {/* Process list */}
        {processes.length > 0 && (
          <div className="mt-2 space-y-1 max-h-36 overflow-y-auto">
            {processes.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-slate-900/50 rounded px-2 py-1">
                <div className="flex items-center gap-2 text-[11px]">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-slate-300">{p.name}</span>
                  <span className="text-slate-600">PID {p.pid}</span>
                </div>
                <button
                  onClick={() => removeProcess(p.id)}
                  className="text-slate-600 hover:text-red-400 text-[10px] transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---- Add Channel ---- */}
      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
        <h3 className="text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">Add IPC Channel</h3>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-1.5">
            <select
              value={channelSource}
              onChange={(e) => setChannelSource(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-600"
            >
              <option value="">Source...</option>
              {processes.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select
              value={channelTarget}
              onChange={(e) => setChannelTarget(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-600"
            >
              <option value="">Target...</option>
              {processes.filter((p) => p.id !== channelSource).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <select
              value={channelType}
              onChange={(e) => setChannelType(e.target.value as IPCType)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-600"
            >
              <option value="pipe">Pipe</option>
              <option value="message_queue">Message Queue</option>
              <option value="shared_memory">Shared Memory</option>
            </select>
            <input
              type="text"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="Name (optional)"
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-600"
            />
          </div>
          <button
            onClick={handleAddChannel}
            disabled={!channelSource || !channelTarget || channelSource === channelTarget}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-600 text-white text-xs py-1.5 rounded-lg font-medium transition-colors"
          >
            + Create Channel
          </button>
        </div>

        {/* Channel list */}
        {channels.length > 0 && (
          <div className="mt-2 space-y-1 max-h-36 overflow-y-auto">
            {channels.map((c) => {
              const src = processes.find((p) => p.id === c.sourceId);
              const tgt = processes.find((p) => p.id === c.targetId);
              return (
                <div key={c.id} className="flex items-center justify-between bg-slate-900/50 rounded px-2 py-1">
                  <div className="text-[10px] text-slate-400">
                    <span className="text-slate-300">{c.name}</span>
                    <span className="text-slate-600 ml-1">
                      ({src?.name} → {tgt?.name})
                    </span>
                  </div>
                  <button
                    onClick={() => removeChannel(c.id)}
                    className="text-slate-600 hover:text-red-400 text-[10px] transition-colors"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---- Export ---- */}
      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
        <h3 className="text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">Export & Replay</h3>
        <div className="flex gap-1.5">
          <button
            onClick={handleExport}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs py-1.5 rounded-lg font-medium transition-colors"
          >
            📋 Export JSON
          </button>
          {showExport && (
            <button
              onClick={handleDownload}
              className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white text-xs py-1.5 rounded-lg font-medium transition-colors"
            >
              💾 Download
            </button>
          )}
        </div>
        {showExport && (
          <div className="mt-2">
            <textarea
              readOnly
              value={exportData.slice(0, 500) + (exportData.length > 500 ? '\n... (truncated)' : '')}
              className="w-full h-24 bg-slate-900 border border-slate-700 rounded-lg p-2 text-[9px] text-slate-400 font-mono resize-none focus:outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
