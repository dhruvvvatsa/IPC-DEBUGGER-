// ============================================================
// IPC Debugger - Core Type Definitions
// Defines all data structures for processes, IPC channels,
// events, and simulation state.
// ============================================================

/** Supported IPC mechanism types */
export type IPCType = 'pipe' | 'message_queue' | 'shared_memory';

/** Process execution states with color coding */
export type ProcessState = 'running' | 'blocked' | 'waiting' | 'terminated' | 'idle';

/** Channel health status for monitoring */
export type ChannelStatus = 'normal' | 'slow' | 'blocked';

/** Types of IPC events that can occur */
export type EventType =
  | 'send'
  | 'receive'
  | 'block'
  | 'unblock'
  | 'read'
  | 'write'
  | 'create'
  | 'destroy'
  | 'delay'
  | 'deadlock'
  | 'race_condition';

/** Severity levels for detected issues */
export type IssueSeverity = 'info' | 'warning' | 'error' | 'critical';

// ------------------------------------------------------------
// Process Definition
// ------------------------------------------------------------
export interface Process {
  id: string;
  name: string;
  pid: number;
  state: ProcessState;
  x: number;         // Position on graph canvas
  y: number;
  cpu: number;       // CPU usage percentage (0-100)
  memory: number;    // Memory usage in MB
  createdAt: number; // Timestamp
  color: string;     // Display color
}

// ------------------------------------------------------------
// IPC Channel Definition
// ------------------------------------------------------------
export interface IPCChannel {
  id: string;
  type: IPCType;
  name: string;
  sourceId: string;       // Source process ID
  targetId: string;       // Target process ID
  status: ChannelStatus;
  throughput: number;     // Messages per second
  latency: number;        // Average latency in ms
  queueSize: number;      // Current queue depth
  maxQueueSize: number;   // Maximum queue capacity
  messagesTotal: number;  // Total messages transferred
  createdAt: number;
}

// ------------------------------------------------------------
// IPC Event (for timeline and logging)
// ------------------------------------------------------------
export interface IPCEvent {
  id: string;
  timestamp: number;
  type: EventType;
  processId: string;
  channelId?: string;
  targetProcessId?: string;
  data?: string;
  duration?: number;      // Duration in ms (for blocking events)
  description: string;
}

// ------------------------------------------------------------
// Shared Memory Segment
// ------------------------------------------------------------
export interface SharedMemorySegment {
  id: string;
  name: string;
  size: number;           // Size in bytes
  address: string;        // Hex address
  accessingProcesses: string[]; // Process IDs currently accessing
  readers: string[];      // Process IDs reading
  writers: string[];      // Process IDs writing
  hasRaceCondition: boolean;
  data: MemoryCell[];
}

export interface MemoryCell {
  offset: number;
  value: number;
  lastWriter?: string;    // Process ID
  lastRead?: string;      // Process ID
  isContested: boolean;   // Multiple simultaneous accessors
}

// ------------------------------------------------------------
// Deadlock Detection
// ------------------------------------------------------------
export interface DeadlockInfo {
  id: string;
  detectedAt: number;
  involvedProcesses: string[];
  involvedChannels: string[];
  cycle: string[];        // Process IDs forming the cycle
  explanation: string;
  suggestion: string;     // AI-style fix suggestion
}

// ------------------------------------------------------------
// Performance Metrics
// ------------------------------------------------------------
export interface PerformanceMetrics {
  timestamp: number;
  messageRate: number;          // Messages per second across all channels
  avgLatency: number;           // Average latency in ms
  totalThroughput: number;      // Total throughput
  queueSizes: Record<string, number>;  // Channel ID -> queue size
  bottlenecks: BottleneckInfo[];
}

export interface BottleneckInfo {
  channelId: string;
  type: 'slow_consumer' | 'overloaded' | 'high_latency';
  severity: IssueSeverity;
  description: string;
  suggestion: string;
}

// ------------------------------------------------------------
// Detected Issues (AI suggestions)
// ------------------------------------------------------------
export interface DetectedIssue {
  id: string;
  timestamp: number;
  severity: IssueSeverity;
  title: string;
  description: string;
  suggestion: string;
  relatedProcesses: string[];
  relatedChannels: string[];
  resolved: boolean;
}

// ------------------------------------------------------------
// Simulation Configuration
// ------------------------------------------------------------
export interface SimulationConfig {
  speed: number;        // 0.5x, 1x, 2x, 4x
  autoGenerate: boolean;
  scenario: ScenarioType;
}

export type ScenarioType =
  | 'custom'
  | 'producer_consumer'
  | 'deadlock'
  | 'race_condition'
  | 'bottleneck'
  | 'pipeline';

export type SimulationState = 'stopped' | 'running' | 'paused';

// ------------------------------------------------------------
// Data Flow Animation
// ------------------------------------------------------------
export interface DataPacket {
  id: string;
  channelId: string;
  sourceId: string;
  targetId: string;
  progress: number;     // 0 to 1
  data: string;
  color: string;
}

// ------------------------------------------------------------
// Tab/View types
// ------------------------------------------------------------
export type MainView = 'dashboard' | 'timeline' | 'memory' | 'performance' | 'simulation';
export type DetailTab = 'properties' | 'events' | 'issues' | 'logs';
