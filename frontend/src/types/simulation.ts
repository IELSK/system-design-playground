export interface NodeResult {
  id: string;
  type: string;
  capacity_rps: number;
  utilization_percent: number;
  latency_contribution_ms: number;
  queue_wait_ms: number;
  effective_rps: number;
  is_bottleneck: boolean;
}

export interface ScalePoint {
  traffic_rps: number;
  latency_ms: number;
  throughput_rps: number;
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
