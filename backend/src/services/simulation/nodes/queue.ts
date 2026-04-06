import { CapacityResult } from "./base";

export function calcQueue(config: Record<string, number>): CapacityResult {
  const workers = config.workers || 1;
  const concurrency = config.concurrency || 1;
  const processing_ms = config.processing_ms || 50;

  return {
    capacity_rps: workers * concurrency * (1000 / processing_ms),
    latency_ms: processing_ms,
  };
}
