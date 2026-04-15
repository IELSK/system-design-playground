export const NODE_TYPES = [
  "client",
  "load_balancer",
  "api",
  "queue",
  "worker",
  "database",
  "cache",
] as const;

export type NodeType = (typeof NODE_TYPES)[number];

export interface ClientConfig {
  rps: number;
}

export interface LoadBalancerConfig {
  instances: number;
  overhead_ms: number;
}

export interface ApiServerConfig {
  instances: number;
  processing_ms: number;
  max_rps_per_instance: number;
}

export interface QueueConfig {
  capacity: number;
  workers: number;
  processing_ms: number;
}

export interface WorkerConfig {
  instances: number;
  processing_ms: number;
  concurrency: number;
}

export interface DatabaseConfig {
  read_latency_ms: number;
  write_latency_ms: number;
  max_connections: number;
}

export interface CacheConfig {
  hit_rate: number;
  read_latency_ms: number;
}

export type NodeConfig =
  | ClientConfig
  | LoadBalancerConfig
  | ApiServerConfig
  | QueueConfig
  | WorkerConfig
  | DatabaseConfig
  | CacheConfig;

export interface NodeData {
  [key: string]: unknown;
  label: string;
  nodeType: NodeType;
  config: NodeConfig;
  bottleneck?: boolean;
  failureMode?: string;
}

export const NODE_LABELS: Record<NodeType, string> = {
  client: "Client",
  load_balancer: "Load Balancer",
  api: "API Server",
  queue: "Queue",
  worker: "Worker",
  database: "Database",
  cache: "Cache",
};

export const NODE_COLORS: Record<NodeType, string> = {
  client: "#6366f1",
  load_balancer: "#8b5cf6",
  api: "#3b82f6",
  queue: "#f59e0b",
  worker: "#f97316",
  database: "#10b981",
  cache: "#ef4444",
};

export const DEFAULT_CONFIGS: Record<NodeType, NodeConfig> = {
  client: { rps: 1000 },
  load_balancer: { instances: 2, overhead_ms: 1 },
  api: { instances: 4, processing_ms: 20, max_rps_per_instance: 500 },
  queue: { capacity: 10000, workers: 4, processing_ms: 50 },
  worker: { instances: 4, processing_ms: 100, concurrency: 10 },
  database: { read_latency_ms: 5, write_latency_ms: 10, max_connections: 200 },
  cache: { hit_rate: 0.8, read_latency_ms: 1 },
};
