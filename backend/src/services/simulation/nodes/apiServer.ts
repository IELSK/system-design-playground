import { CapacityResult } from "./base";

export function calcApiServer(config: Record<string, number>): CapacityResult {
  const instances = config.instances || 1;
  const processing_ms = config.processing_ms || 10;
  const max_rps_per_instance = config.max_rps_per_instance || 500;

  return {
    capacity_rps: instances * max_rps_per_instance,
    latency_ms: processing_ms,
  };
}
