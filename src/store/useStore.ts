// ============================================================
// IPC Debugger - Global State Store (Zustand)
// Manages all simulation state including processes, channels,
// events, deadlock detection, performance metrics, and
// simulation controls.
// ============================================================

import { create } from 'zustand';
import type {
  Process, IPCChannel, IPCEvent, SharedMemorySegment,
  DeadlockInfo, PerformanceMetrics, DetectedIssue,
  SimulationState, SimulationConfig, DataPacket,
  MainView, DetailTab, ScenarioType, BottleneckInfo,
} from '../types/ipc';
import { scenarios } from '../data/scenarios';

// Unique ID generator
let _idCounter = 0;
const uid = (prefix = 'id') => `${prefix}_${++_idCounter}_${Date.now().toString(36)}`;

// Color palette for new processes
const PROCESS_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

// ---------------------------------------------------------------
// Store Interface
// ---------------------------------------------------------------
interface IPCStore {
  // Data
  processes: Process[];
  channels: IPCChannel[];
  events: IPCEvent[];
  sharedMemory: SharedMemorySegment[];
  deadlocks: DeadlockInfo[];
  metrics: PerformanceMetrics[];
  issues: DetectedIssue[];
  packets: DataPacket[];

  // UI State
  mainView: MainView;
  detailTab: DetailTab;
  selectedProcessId: string | null;
  selectedChannelId: string | null;
  showSidebar: boolean;

  // Simulation
  simState: SimulationState;
  simConfig: SimulationConfig;
  simTick: number;
  simStartTime: number;

  // Actions
  setMainView: (v: MainView) => void;
  setDetailTab: (t: DetailTab) => void;
  selectProcess: (id: string | null) => void;
  selectChannel: (id: string | null) => void;
  toggleSidebar: () => void;

  // Process CRUD
  addProcess: (name: string, x?: number, y?: number) => void;
  removeProcess: (id: string) => void;
  updateProcessPosition: (id: string, x: number, y: number) => void;

  // Channel CRUD
  addChannel: (sourceId: string, targetId: string, type: IPCChannel['type'], name?: string) => void;
  removeChannel: (id: string) => void;

  // Simulation controls
  loadScenario: (type: ScenarioType) => void;
  startSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  stepSimulation: () => void;
  setSimSpeed: (speed: number) => void;
  tick: () => void;

  // Deadlock
  detectDeadlocks: () => void;

  // Issues
  resolveIssue: (id: string) => void;

  // Export
  exportLogs: () => string;
}

// ---------------------------------------------------------------
// Store Implementation
// ---------------------------------------------------------------
export const useStore = create<IPCStore>((set, get) => ({
  // Initial data
  processes: [],
  channels: [],
  events: [],
  sharedMemory: [],
  deadlocks: [],
  metrics: [],
  issues: [],
  packets: [],

  // Initial UI state
  mainView: 'dashboard',
  detailTab: 'properties',
  selectedProcessId: null,
  selectedChannelId: null,
  showSidebar: true,

  // Initial simulation state
  simState: 'stopped',
  simConfig: { speed: 1, autoGenerate: true, scenario: 'producer_consumer' },
  simTick: 0,
  simStartTime: Date.now(),

  // ---- UI Actions ----
  setMainView: (v) => set({ mainView: v }),
  setDetailTab: (t) => set({ detailTab: t }),
  selectProcess: (id) => set({ selectedProcessId: id, selectedChannelId: null }),
  selectChannel: (id) => set({ selectedChannelId: id, selectedProcessId: null }),
  toggleSidebar: () => set((s) => ({ showSidebar: !s.showSidebar })),

  // ---- Process CRUD ----
  addProcess: (name, x, y) => {
    const state = get();
    const idx = state.processes.length;
    const newProcess: Process = {
      id: uid('proc'),
      name,
      pid: 1000 + idx + Math.floor(Math.random() * 9000),
      state: 'idle',
      x: x ?? 100 + (idx % 4) * 170,
      y: y ?? 150 + Math.floor(idx / 4) * 180,
      cpu: 0,
      memory: Math.floor(Math.random() * 40) + 10,
      createdAt: Date.now(),
      color: PROCESS_COLORS[idx % PROCESS_COLORS.length],
    };
    set((s) => ({
      processes: [...s.processes, newProcess],
      events: [...s.events, {
        id: uid('evt'),
        timestamp: Date.now(),
        type: 'create' as const,
        processId: newProcess.id,
        description: `Process "${name}" (PID ${newProcess.pid}) created`,
      }],
    }));
  },

  removeProcess: (id) => set((s) => ({
    processes: s.processes.filter((p) => p.id !== id),
    channels: s.channels.filter((c) => c.sourceId !== id && c.targetId !== id),
    selectedProcessId: s.selectedProcessId === id ? null : s.selectedProcessId,
  })),

  updateProcessPosition: (id, x, y) => set((s) => ({
    processes: s.processes.map((p) => (p.id === id ? { ...p, x, y } : p)),
  })),

  // ---- Channel CRUD ----
  addChannel: (sourceId, targetId, type, name) => {
    const channelName = name || `${type}-${uid('ch').slice(0, 6)}`;
    const newChannel: IPCChannel = {
      id: uid('chan'),
      type,
      name: channelName,
      sourceId,
      targetId,
      status: 'normal',
      throughput: 0,
      latency: 0,
      queueSize: 0,
      maxQueueSize: type === 'shared_memory' ? 0 : 100,
      messagesTotal: 0,
      createdAt: Date.now(),
    };
    set((s) => ({
      channels: [...s.channels, newChannel],
      events: [...s.events, {
        id: uid('evt'),
        timestamp: Date.now(),
        type: 'create' as const,
        processId: sourceId,
        channelId: newChannel.id,
        targetProcessId: targetId,
        description: `Channel "${channelName}" (${type}) created between processes`,
      }],
    }));
  },

  removeChannel: (id) => set((s) => ({
    channels: s.channels.filter((c) => c.id !== id),
    selectedChannelId: s.selectedChannelId === id ? null : s.selectedChannelId,
  })),

  // ---- Scenario Loading ----
  loadScenario: (type) => {
    const scenario = scenarios[type];
    const now = Date.now();
    set({
      processes: scenario.processes.map((p) => ({ ...p, createdAt: now })),
      channels: scenario.channels.map((c) => ({ ...c, createdAt: now })),
      sharedMemory: scenario.sharedMemory || [],
      events: [{
        id: uid('evt'),
        timestamp: now,
        type: 'create' as const,
        processId: '',
        description: `Loaded scenario: ${scenario.name}`,
      }],
      deadlocks: [],
      metrics: [],
      issues: [],
      packets: [],
      simState: 'stopped',
      simTick: 0,
      simStartTime: now,
      simConfig: { ...get().simConfig, scenario: type },
      selectedProcessId: null,
      selectedChannelId: null,
    });
  },

  // ---- Simulation Controls ----
  startSimulation: () => {
    const state = get();
    if (state.processes.length === 0) {
      // Auto-load default scenario if empty
      get().loadScenario(state.simConfig.scenario === 'custom' ? 'producer_consumer' : state.simConfig.scenario);
    }
    set({ simState: 'running', simStartTime: Date.now() });
  },

  pauseSimulation: () => set({ simState: 'paused' }),

  resetSimulation: () => {
    const cfg = get().simConfig;
    if (cfg.scenario !== 'custom') {
      get().loadScenario(cfg.scenario);
    } else {
      set({
        events: [],
        deadlocks: [],
        metrics: [],
        issues: [],
        packets: [],
        simState: 'stopped',
        simTick: 0,
      });
    }
  },

  stepSimulation: () => {
    const state = get();
    if (state.simState !== 'running') {
      set({ simState: 'paused' });
    }
    get().tick();
  },

  setSimSpeed: (speed) => set((s) => ({
    simConfig: { ...s.simConfig, speed },
  })),

  // ---- Main Simulation Tick ----
  tick: () => {
    const state = get();
    const now = Date.now();
    const tick = state.simTick + 1;
    const newEvents: IPCEvent[] = [];
    const newPackets: DataPacket[] = [];
    const scenario = state.simConfig.scenario;

    // Update processes
    const updatedProcesses = state.processes.map((p) => {
      let newState = p.state;
      let cpu = p.cpu;
      let memory = p.memory;

      if (scenario === 'deadlock' && tick > 5) {
        newState = 'blocked';
        cpu = 0;
      } else if (p.state !== 'terminated') {
        // Simulate CPU fluctuation
        cpu = Math.max(0, Math.min(100, cpu + (Math.random() - 0.5) * 15));
        memory = Math.max(10, Math.min(100, memory + (Math.random() - 0.5) * 5));

        // Random state changes
        const r = Math.random();
        if (r < 0.02) newState = 'blocked';
        else if (r < 0.05) newState = 'waiting';
        else if (newState === 'blocked' && r > 0.7) newState = 'running';
        else if (newState === 'waiting' && r > 0.6) newState = 'running';
        else if (newState === 'idle') newState = 'running';
      }

      return { ...p, state: newState, cpu: Math.round(cpu), memory: Math.round(memory) };
    });

    // Update channels
    const updatedChannels = state.channels.map((c) => {
      let throughput = c.throughput;
      let latency = c.latency;
      let queueSize = c.queueSize;
      let status = c.status;
      let messagesTotal = c.messagesTotal;

      if (scenario === 'deadlock' && tick > 5) {
        status = 'blocked';
        throughput = 0;
        latency = 999;
      } else if (scenario === 'bottleneck' && c.id === 'c3') {
        // Slow consumer channel stays slow/blocked
        throughput = Math.max(10, throughput + (Math.random() - 0.7) * 10);
        queueSize = Math.min(c.maxQueueSize, queueSize + Math.floor(Math.random() * 3));
        latency = Math.max(50, latency + (Math.random() - 0.3) * 20);
        status = queueSize > c.maxQueueSize * 0.9 ? 'blocked' : 'slow';
      } else {
        // Normal simulation
        throughput = Math.max(0, throughput + (Math.random() - 0.5) * 20);
        latency = Math.max(1, latency + (Math.random() - 0.5) * 5);
        const qDelta = Math.floor(Math.random() * 5) - 2;
        queueSize = Math.max(0, Math.min(c.maxQueueSize || 999, queueSize + qDelta));

        if (c.maxQueueSize > 0) {
          const ratio = queueSize / c.maxQueueSize;
          status = ratio > 0.9 ? 'blocked' : ratio > 0.6 ? 'slow' : 'normal';
        } else {
          status = latency > 50 ? 'slow' : 'normal';
        }

        messagesTotal += Math.floor(Math.random() * 5);
      }

      return {
        ...c,
        throughput: Math.round(throughput * 10) / 10,
        latency: Math.round(latency * 10) / 10,
        queueSize,
        status,
        messagesTotal,
      };
    });

    // Generate random events
    if (tick % 3 === 0 && updatedProcesses.length > 0 && updatedChannels.length > 0) {
      const randProcess = updatedProcesses[Math.floor(Math.random() * updatedProcesses.length)];
      const processChannels = updatedChannels.filter(
        (c) => c.sourceId === randProcess.id || c.targetId === randProcess.id
      );
      if (processChannels.length > 0) {
        const randChannel = processChannels[Math.floor(Math.random() * processChannels.length)];
        const isSender = randChannel.sourceId === randProcess.id;
        const eventType = isSender ? 'send' : 'receive';
        const targetProc = updatedProcesses.find(
          (p) => p.id === (isSender ? randChannel.targetId : randChannel.sourceId)
        );
        newEvents.push({
          id: uid('evt'),
          timestamp: now,
          type: eventType,
          processId: randProcess.id,
          channelId: randChannel.id,
          targetProcessId: targetProc?.id,
          data: `msg_${tick}`,
          description: `${randProcess.name} ${eventType === 'send' ? 'sent message to' : 'received message from'} ${targetProc?.name || 'unknown'} via ${randChannel.name}`,
        });

        // Create data packet for animation
        if (eventType === 'send') {
          newPackets.push({
            id: uid('pkt'),
            channelId: randChannel.id,
            sourceId: randChannel.sourceId,
            targetId: randChannel.targetId,
            progress: 0,
            data: `msg_${tick}`,
            color: randProcess.color,
          });
        }
      }
    }

    // Generate blocking events for deadlock scenario
    if (scenario === 'deadlock' && tick === 6) {
      updatedProcesses.forEach((p) => {
        newEvents.push({
          id: uid('evt'),
          timestamp: now,
          type: 'block',
          processId: p.id,
          description: `${p.name} is BLOCKED waiting for resource`,
        });
      });
    }

    // Animate existing packets
    const animatedPackets = [
      ...state.packets
        .map((p) => ({ ...p, progress: p.progress + 0.08 * state.simConfig.speed }))
        .filter((p) => p.progress < 1),
      ...newPackets,
    ];

    // Update shared memory for race condition scenario
    let updatedSharedMemory = state.sharedMemory;
    if (scenario === 'race_condition' && state.sharedMemory.length > 0) {
      updatedSharedMemory = state.sharedMemory.map((seg) => ({
        ...seg,
        data: seg.data.map((cell, i) => ({
          ...cell,
          value: i < 8 ? (cell.value + Math.floor(Math.random() * 10)) % 256 : cell.value,
          lastWriter: Math.random() > 0.5 ? 'p1' : 'p2',
          isContested: i < 8 && Math.random() > 0.3,
        })),
      }));

      // Generate race condition events
      if (tick % 5 === 0) {
        newEvents.push({
          id: uid('evt'),
          timestamp: now,
          type: 'race_condition',
          processId: 'p1',
          targetProcessId: 'p2',
          description: '⚠ Race condition detected: Writer-1 and Writer-2 accessing same memory region simultaneously',
        });
      }
    }

    // Performance metrics (every 5 ticks)
    let newMetrics = state.metrics;
    if (tick % 5 === 0) {
      const qSizes: Record<string, number> = {};
      updatedChannels.forEach((c) => { qSizes[c.id] = c.queueSize; });

      const avgLat = updatedChannels.length > 0
        ? updatedChannels.reduce((a, c) => a + c.latency, 0) / updatedChannels.length
        : 0;
      const totalThroughput = updatedChannels.reduce((a, c) => a + c.throughput, 0);
      const msgRate = updatedChannels.reduce((a, c) => a + c.throughput, 0);

      const bottlenecks: BottleneckInfo[] = [];
      updatedChannels.forEach((c) => {
        if (c.status === 'blocked') {
          bottlenecks.push({
            channelId: c.id,
            type: 'overloaded',
            severity: 'critical',
            description: `Channel "${c.name}" is blocked (queue full)`,
            suggestion: 'Increase consumer processing speed or add more consumers',
          });
        } else if (c.status === 'slow') {
          bottlenecks.push({
            channelId: c.id,
            type: 'slow_consumer',
            severity: 'warning',
            description: `Channel "${c.name}" is slowing down`,
            suggestion: 'Consider load balancing or increasing buffer size',
          });
        }
      });

      const metric: PerformanceMetrics = {
        timestamp: now,
        messageRate: Math.round(msgRate),
        avgLatency: Math.round(avgLat * 10) / 10,
        totalThroughput: Math.round(totalThroughput),
        queueSizes: qSizes,
        bottlenecks,
      };
      newMetrics = [...state.metrics.slice(-59), metric]; // Keep last 60 data points
    }

    // Detect issues
    let newIssues = [...state.issues];
    if (tick % 10 === 0) {
      // Check for high latency
      updatedChannels.forEach((c) => {
        if (c.latency > 100 && !newIssues.find((i) => i.relatedChannels.includes(c.id) && !i.resolved && i.title.includes('latency'))) {
          newIssues.push({
            id: uid('issue'),
            timestamp: now,
            severity: 'warning',
            title: `High latency on ${c.name}`,
            description: `Channel "${c.name}" has latency of ${c.latency.toFixed(1)}ms which exceeds threshold.`,
            suggestion: 'Consider reducing message size, adding buffering, or optimizing the consumer process.',
            relatedProcesses: [c.sourceId, c.targetId],
            relatedChannels: [c.id],
            resolved: false,
          });
        }
      });

      // Check for queue overflow
      updatedChannels.forEach((c) => {
        if (c.maxQueueSize > 0 && c.queueSize > c.maxQueueSize * 0.85 && !newIssues.find((i) => i.relatedChannels.includes(c.id) && !i.resolved && i.title.includes('Queue'))) {
          newIssues.push({
            id: uid('issue'),
            timestamp: now,
            severity: 'error',
            title: `Queue overflow risk on ${c.name}`,
            description: `Queue is at ${Math.round(c.queueSize / c.maxQueueSize * 100)}% capacity (${c.queueSize}/${c.maxQueueSize}).`,
            suggestion: 'Add flow control (backpressure), increase queue size, or add more consumer processes.',
            relatedProcesses: [c.sourceId, c.targetId],
            relatedChannels: [c.id],
            resolved: false,
          });
        }
      });
    }

    set({
      processes: updatedProcesses,
      channels: updatedChannels,
      events: [...state.events, ...newEvents].slice(-500), // Keep last 500 events
      sharedMemory: updatedSharedMemory,
      metrics: newMetrics,
      issues: newIssues.slice(-50),
      packets: animatedPackets,
      simTick: tick,
    });

    // Auto-detect deadlocks
    if (tick % 10 === 0) {
      get().detectDeadlocks();
    }
  },

  // ---- Deadlock Detection (Wait-For Graph) ----
  detectDeadlocks: () => {
    const { processes, channels } = get();
    const blockedProcesses = processes.filter((p) => p.state === 'blocked');

    if (blockedProcesses.length < 2) {
      set({ deadlocks: [] });
      return;
    }

    // Build adjacency list (wait-for graph)
    const waitFor: Record<string, string[]> = {};
    blockedProcesses.forEach((p) => {
      waitFor[p.id] = [];
      channels.forEach((c) => {
        if (c.sourceId === p.id && c.status === 'blocked') {
          waitFor[p.id].push(c.targetId);
        }
      });
    });

    // DFS cycle detection
    const visited = new Set<string>();
    const inStack = new Set<string>();
    const cycles: string[][] = [];

    function dfs(node: string, path: string[]): void {
      visited.add(node);
      inStack.add(node);
      path.push(node);

      for (const neighbor of (waitFor[node] || [])) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path]);
        } else if (inStack.has(neighbor)) {
          const cycleStart = path.indexOf(neighbor);
          if (cycleStart !== -1) {
            cycles.push(path.slice(cycleStart));
          }
        }
      }

      inStack.delete(node);
    }

    Object.keys(waitFor).forEach((node) => {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    });

    const deadlocks: DeadlockInfo[] = cycles.map((cycle) => {
      const involvedChannels = channels
        .filter((c) => cycle.includes(c.sourceId) && cycle.includes(c.targetId))
        .map((c) => c.id);

      const processNames = cycle.map((id) => processes.find((p) => p.id === id)?.name || id);

      return {
        id: uid('dl'),
        detectedAt: Date.now(),
        involvedProcesses: cycle,
        involvedChannels,
        cycle,
        explanation: `Circular dependency detected: ${processNames.join(' → ')} → ${processNames[0]}. Each process is waiting for a resource held by the next process in the cycle.`,
        suggestion: 'Break the cycle by: (1) Implementing resource ordering, (2) Adding timeouts to blocking operations, (3) Using try-lock instead of blocking lock, or (4) Restructuring the communication pattern.',
      };
    });

    // Add deadlock issue
    if (deadlocks.length > 0 && !get().issues.find((i) => i.title === 'Deadlock Detected' && !i.resolved)) {
      set((s) => ({
        issues: [...s.issues, {
          id: uid('issue'),
          timestamp: Date.now(),
          severity: 'critical' as const,
          title: 'Deadlock Detected',
          description: deadlocks[0].explanation,
          suggestion: deadlocks[0].suggestion,
          relatedProcesses: deadlocks[0].involvedProcesses,
          relatedChannels: deadlocks[0].involvedChannels,
          resolved: false,
        }],
      }));
    }

    set({ deadlocks });
  },

  // ---- Issue Resolution ----
  resolveIssue: (id) => set((s) => ({
    issues: s.issues.map((i) => (i.id === id ? { ...i, resolved: true } : i)),
  })),

  // ---- Export Logs ----
  exportLogs: () => {
    const { processes, channels, events, deadlocks, metrics, issues } = get();
    const data = {
      exportedAt: new Date().toISOString(),
      processes,
      channels,
      events: events.slice(-200),
      deadlocks,
      metrics: metrics.slice(-60),
      issues,
    };
    return JSON.stringify(data, null, 2);
  },
}));
