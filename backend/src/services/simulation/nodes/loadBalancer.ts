import { CapacityResult } from "./base";

export function calcLoadBalancer(config: Record<string, number>): CapacityResult {
  const instances = config.instances || 1;
  const overhead_ms = config.overhead_ms || 1;

  return {
    capacity_rps: instances * (1000 / overhead_ms),
    latency_ms: overhead_ms,
  };
}
