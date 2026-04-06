import { CapacityResult } from "./base";

export function calcWorker(config: Record<string, number>): CapacityResult {
  const instances = config.instances || 1;
  const concurrency = config.concurrency || 1;
  const processing_ms = config.processing_ms || 100;

  return {
    capacity_rps: instances * concurrency * (1000 / processing_ms),
    latency_ms: processing_ms,
  };
}