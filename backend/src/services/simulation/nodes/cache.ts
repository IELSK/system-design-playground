import { CapacityResult } from "./base";

export function calcCache(config: Record<string, number>): CapacityResult {
  const read_latency_ms = config.read_latency_ms || 1;

  return {
    capacity_rps: 100000,
    latency_ms: read_latency_ms,
  };
}
