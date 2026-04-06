import { CapacityResult } from "./base";

export function calcDatabase(config: Record<string, number>): CapacityResult {
  const read_latency_ms = config.read_latency_ms || 5;
  const write_latency_ms = config.write_latency_ms || 10;
  const max_connections = config.max_connections || 100;

  const avg_query_ms = (read_latency_ms + write_latency_ms) / 2;

  return {
    capacity_rps: max_connections * (1000 / avg_query_ms),
    latency_ms: read_latency_ms,
  };
}
