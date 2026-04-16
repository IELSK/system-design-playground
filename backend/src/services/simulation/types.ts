export interface SimulationRequest {
  traffic: number;
  nodes: SimNode[];
  edges: SimEdge[];
  failures: Failure[];
}

export interface SimNode {
  id: string;
  type: string;
  config: Record<string, number>;
}

export interface SimEdge {
  source: string;
  target: string;
  weight?: number;
}

export type FailureType =
  | "node_down"
  | "slow_response"
  | "partial_failure"
  | "capacity_degraded";

export interface Failure {
  node_id: string;
  type: FailureType;
  factor?: number;
  percent?: number;
  error_percent?: number;
}

export interface NodeResult {
  id: string;
  type: string;
  capacity_rps: number;
  utilization_percent: number;
  latency_contribution_ms: number;
  queue_wait_ms: number;
  effective_rps: number;
  is_bottleneck: boolean;
  failure_mode?: FailureType;
}

export interface ScalePoint {
  traffic_rps: number;
  latency_ms: number;
  throughput_rps: number;
  error_rate_percent: number;
  bottleneck: string | null;
}

export interface SimulationResponse {
  summary: {
    total_latency_ms: number;
    throughput_rps: number;
    error_rate_percent: number;
    bottleneck_node_id: string | null;
  };
  nodes: NodeResult[];
  scale_projection: ScalePoint[];
}
