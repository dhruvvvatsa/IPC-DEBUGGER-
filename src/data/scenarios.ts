// ============================================================
// Pre-built Demo Scenarios
// Provides sample process/channel configurations for common
// IPC patterns: producer-consumer, deadlock, race conditions,
// bottleneck, and pipeline architectures.
// ============================================================

import type { Process, IPCChannel, SharedMemorySegment, ScenarioType } from '../types/ipc';

interface ScenarioData {
  name: string;
  description: string;
  processes: Omit<Process, 'createdAt'>[];
  channels: Omit<IPCChannel, 'createdAt'>[];
  sharedMemory?: SharedMemorySegment[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export const scenarios: Record<ScenarioType, ScenarioData> = {
  custom: {
    name: 'Custom',
    description: 'Start with an empty canvas and build your own IPC configuration.',
    processes: [],
    channels: [],
  },

  producer_consumer: {
    name: 'Producer-Consumer',
    description: 'Classic pattern where producer processes send data through message queues to consumer processes.',
    processes: [
      { id: 'p1', name: 'Producer A', pid: 1001, state: 'running', x: 150, y: 200, cpu: 45, memory: 32, color: COLORS[0] },
      { id: 'p2', name: 'Producer B', pid: 1002, state: 'running', x: 150, y: 400, cpu: 38, memory: 28, color: COLORS[1] },
      { id: 'p3', name: 'Consumer X', pid: 1003, state: 'running', x: 550, y: 200, cpu: 62, memory: 48, color: COLORS[2] },
      { id: 'p4', name: 'Consumer Y', pid: 1004, state: 'waiting', x: 550, y: 400, cpu: 15, memory: 24, color: COLORS[3] },
    ],
    channels: [
      { id: 'c1', type: 'message_queue', name: 'MQ-Alpha', sourceId: 'p1', targetId: 'p3', status: 'normal', throughput: 120, latency: 5, queueSize: 8, maxQueueSize: 100, messagesTotal: 1450 },
      { id: 'c2', type: 'message_queue', name: 'MQ-Beta', sourceId: 'p1', targetId: 'p4', status: 'slow', throughput: 45, latency: 25, queueSize: 67, maxQueueSize: 100, messagesTotal: 890 },
      { id: 'c3', type: 'pipe', name: 'Pipe-1', sourceId: 'p2', targetId: 'p3', status: 'normal', throughput: 95, latency: 3, queueSize: 2, maxQueueSize: 50, messagesTotal: 2100 },
      { id: 'c4', type: 'pipe', name: 'Pipe-2', sourceId: 'p2', targetId: 'p4', status: 'normal', throughput: 88, latency: 4, queueSize: 5, maxQueueSize: 50, messagesTotal: 1780 },
    ],
  },

  deadlock: {
    name: 'Deadlock Scenario',
    description: 'Four processes in a circular wait condition, demonstrating a classic deadlock.',
    processes: [
      { id: 'p1', name: 'Process Alpha', pid: 2001, state: 'blocked', x: 200, y: 150, cpu: 0, memory: 40, color: COLORS[0] },
      { id: 'p2', name: 'Process Beta', pid: 2002, state: 'blocked', x: 500, y: 150, cpu: 0, memory: 36, color: COLORS[1] },
      { id: 'p3', name: 'Process Gamma', pid: 2003, state: 'blocked', x: 500, y: 400, cpu: 0, memory: 44, color: COLORS[2] },
      { id: 'p4', name: 'Process Delta', pid: 2004, state: 'blocked', x: 200, y: 400, cpu: 0, memory: 32, color: COLORS[3] },
    ],
    channels: [
      { id: 'c1', type: 'pipe', name: 'Lock-AB', sourceId: 'p1', targetId: 'p2', status: 'blocked', throughput: 0, latency: 999, queueSize: 50, maxQueueSize: 50, messagesTotal: 340 },
      { id: 'c2', type: 'pipe', name: 'Lock-BC', sourceId: 'p2', targetId: 'p3', status: 'blocked', throughput: 0, latency: 999, queueSize: 50, maxQueueSize: 50, messagesTotal: 280 },
      { id: 'c3', type: 'pipe', name: 'Lock-CD', sourceId: 'p3', targetId: 'p4', status: 'blocked', throughput: 0, latency: 999, queueSize: 50, maxQueueSize: 50, messagesTotal: 310 },
      { id: 'c4', type: 'pipe', name: 'Lock-DA', sourceId: 'p4', targetId: 'p1', status: 'blocked', throughput: 0, latency: 999, queueSize: 50, maxQueueSize: 50, messagesTotal: 295 },
    ],
  },

  race_condition: {
    name: 'Race Condition',
    description: 'Multiple processes accessing shared memory simultaneously without proper synchronization.',
    processes: [
      { id: 'p1', name: 'Writer-1', pid: 3001, state: 'running', x: 120, y: 180, cpu: 55, memory: 30, color: COLORS[0] },
      { id: 'p2', name: 'Writer-2', pid: 3002, state: 'running', x: 120, y: 370, cpu: 52, memory: 28, color: COLORS[1] },
      { id: 'p3', name: 'Reader-1', pid: 3003, state: 'running', x: 550, y: 180, cpu: 30, memory: 22, color: COLORS[2] },
      { id: 'p4', name: 'Reader-2', pid: 3004, state: 'running', x: 550, y: 370, cpu: 28, memory: 20, color: COLORS[3] },
    ],
    channels: [
      { id: 'c1', type: 'shared_memory', name: 'SHM-Counter', sourceId: 'p1', targetId: 'p3', status: 'normal', throughput: 200, latency: 1, queueSize: 0, maxQueueSize: 0, messagesTotal: 5600 },
      { id: 'c2', type: 'shared_memory', name: 'SHM-Counter', sourceId: 'p2', targetId: 'p3', status: 'normal', throughput: 195, latency: 1, queueSize: 0, maxQueueSize: 0, messagesTotal: 5400 },
      { id: 'c3', type: 'shared_memory', name: 'SHM-Counter', sourceId: 'p1', targetId: 'p4', status: 'slow', throughput: 180, latency: 2, queueSize: 0, maxQueueSize: 0, messagesTotal: 5100 },
      { id: 'c4', type: 'shared_memory', name: 'SHM-Counter', sourceId: 'p2', targetId: 'p4', status: 'slow', throughput: 175, latency: 2, queueSize: 0, maxQueueSize: 0, messagesTotal: 4900 },
    ],
    sharedMemory: [
      {
        id: 'shm1',
        name: 'SHM-Counter',
        size: 4096,
        address: '0x7f8a3c000000',
        accessingProcesses: ['p1', 'p2', 'p3', 'p4'],
        readers: ['p3', 'p4'],
        writers: ['p1', 'p2'],
        hasRaceCondition: true,
        data: Array.from({ length: 32 }, (_, i) => ({
          offset: i * 128,
          value: Math.floor(Math.random() * 256),
          lastWriter: Math.random() > 0.5 ? 'p1' : 'p2',
          lastRead: Math.random() > 0.5 ? 'p3' : 'p4',
          isContested: i < 8,
        })),
      },
    ],
  },

  bottleneck: {
    name: 'Bottleneck',
    description: 'A slow consumer creates a bottleneck, causing queue buildup and increased latency.',
    processes: [
      { id: 'p1', name: 'Fast Producer', pid: 4001, state: 'running', x: 120, y: 200, cpu: 80, memory: 45, color: COLORS[0] },
      { id: 'p2', name: 'Fast Producer 2', pid: 4002, state: 'running', x: 120, y: 380, cpu: 75, memory: 42, color: COLORS[1] },
      { id: 'p3', name: 'Router', pid: 4003, state: 'running', x: 350, y: 290, cpu: 90, memory: 60, color: COLORS[4] },
      { id: 'p4', name: 'Slow Consumer', pid: 4004, state: 'running', x: 580, y: 200, cpu: 98, memory: 85, color: COLORS[3] },
      { id: 'p5', name: 'Fast Consumer', pid: 4005, state: 'idle', x: 580, y: 380, cpu: 12, memory: 20, color: COLORS[2] },
    ],
    channels: [
      { id: 'c1', type: 'message_queue', name: 'Input-Q1', sourceId: 'p1', targetId: 'p3', status: 'slow', throughput: 200, latency: 15, queueSize: 78, maxQueueSize: 100, messagesTotal: 8900 },
      { id: 'c2', type: 'message_queue', name: 'Input-Q2', sourceId: 'p2', targetId: 'p3', status: 'slow', throughput: 190, latency: 18, queueSize: 82, maxQueueSize: 100, messagesTotal: 8200 },
      { id: 'c3', type: 'pipe', name: 'Output-1', sourceId: 'p3', targetId: 'p4', status: 'blocked', throughput: 30, latency: 150, queueSize: 48, maxQueueSize: 50, messagesTotal: 3200 },
      { id: 'c4', type: 'pipe', name: 'Output-2', sourceId: 'p3', targetId: 'p5', status: 'normal', throughput: 180, latency: 3, queueSize: 2, maxQueueSize: 50, messagesTotal: 7600 },
    ],
  },

  pipeline: {
    name: 'Pipeline',
    description: 'A multi-stage processing pipeline where data flows sequentially through processes.',
    processes: [
      { id: 'p1', name: 'Source', pid: 5001, state: 'running', x: 80, y: 290, cpu: 35, memory: 25, color: COLORS[0] },
      { id: 'p2', name: 'Stage 1: Parse', pid: 5002, state: 'running', x: 230, y: 290, cpu: 50, memory: 35, color: COLORS[1] },
      { id: 'p3', name: 'Stage 2: Transform', pid: 5003, state: 'running', x: 380, y: 290, cpu: 65, memory: 48, color: COLORS[2] },
      { id: 'p4', name: 'Stage 3: Validate', pid: 5004, state: 'running', x: 530, y: 290, cpu: 40, memory: 30, color: COLORS[4] },
      { id: 'p5', name: 'Sink', pid: 5005, state: 'running', x: 680, y: 290, cpu: 20, memory: 22, color: COLORS[5] },
    ],
    channels: [
      { id: 'c1', type: 'pipe', name: 'Pipe-S1', sourceId: 'p1', targetId: 'p2', status: 'normal', throughput: 100, latency: 5, queueSize: 3, maxQueueSize: 50, messagesTotal: 4500 },
      { id: 'c2', type: 'pipe', name: 'Pipe-12', sourceId: 'p2', targetId: 'p3', status: 'normal', throughput: 95, latency: 8, queueSize: 7, maxQueueSize: 50, messagesTotal: 4200 },
      { id: 'c3', type: 'message_queue', name: 'MQ-23', sourceId: 'p3', targetId: 'p4', status: 'slow', throughput: 70, latency: 20, queueSize: 35, maxQueueSize: 100, messagesTotal: 3800 },
      { id: 'c4', type: 'pipe', name: 'Pipe-3S', sourceId: 'p4', targetId: 'p5', status: 'normal', throughput: 68, latency: 4, queueSize: 2, maxQueueSize: 50, messagesTotal: 3600 },
    ],
  },
};

export function getScenarioDescription(type: ScenarioType): string {
  return scenarios[type].description;
}

export function getScenarioName(type: ScenarioType): string {
  return scenarios[type].name;
}
