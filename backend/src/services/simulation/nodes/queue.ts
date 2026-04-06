import { CapacityResult } from "./base";

export function calcQueue(config: Record<string, number>): CapacityResult {
  const capacity = config.capacity || 10000;

  return {
    capacity_rps: capacity,
    latency_ms: 1,
  };
}