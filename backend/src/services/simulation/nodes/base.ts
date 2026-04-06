export interface CapacityResult {
  capacity_rps: number;
  latency_ms: number;
}

export type CapacityCalculator = (config: Record<string, number>) => CapacityResult;
