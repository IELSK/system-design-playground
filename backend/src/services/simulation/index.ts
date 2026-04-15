import {
  SimNode,
  SimEdge,
  NodeResult,
  SimulationResponse,
  ScalePoint,
  Failure,
  FailureType,
} from "./types";
import { topologicalSort, buildAdjacencyList } from "./graph";
import { CapacityResult } from "./nodes/base";
import { calcLoadBalancer } from "./nodes/loadBalancer";
import { calcApiServer } from "./nodes/apiServer";
import { calcQueue } from "./nodes/queue";
import { calcWorker } from "./nodes/worker";
import { calcDatabase } from "./nodes/database";
import { calcCache } from "./nodes/cache";

const SCALE_TRAFFIC_LEVELS = [100, 500, 1000, 2000, 5000, 10000, 20000];

function getCapacity(node: SimNode): CapacityResult {
  switch (node.type) {
    case "load_balancer":
      return calcLoadBalancer(node.config);
    case "api":
      return calcApiServer(node.config);
    case "queue":
      return calcQueue(node.config);
    case "worker":
      return calcWorker(node.config);
    case "database":
      return calcDatabase(node.config);
    case "cache":
      return calcCache(node.config);
    default:
      return { capacity_rps: Infinity, latency_ms: 0 };
  }
}

function applyFailure(
  capacity: number,
  latency: number,
  failure: Failure | undefined,
): { capacity: number; latency: number } {
  if (!failure) return { capacity, latency };
  switch (failure.type) {
    case "node_down":
      return { capacity: 0, latency };
    case "slow_response":
      return { capacity, latency: latency * (failure.factor ?? 3) };
    case "capacity_degraded": {
      const ratio =
        failure.percent !== undefined
          ? Math.max(0, 1 - failure.percent / 100)
          : (failure.factor ?? 0.5);
      return { capacity: capacity * ratio, latency };
    }
    default:
      return { capacity, latency };
  }
}

function buildOutgoingMap(edges: SimEdge[]): Record<string, SimEdge[]> {
  const out: Record<string, SimEdge[]> = {};
  for (const e of edges) {
    if (!out[e.source]) out[e.source] = [];
    out[e.source].push(e);
  }
  return out;
}

function edgeWeight(edge: SimEdge, siblings: SimEdge[]): number {
  if (siblings.length === 0) return 0;
  if (siblings.length === 1) return 1;
  const anyWeighted = siblings.some((e) => e.weight !== undefined);
  if (!anyWeighted) return 1 / siblings.length;
  const total = siblings.reduce((s, e) => s + (e.weight ?? 0), 0);
  if (total === 0) return 1 / siblings.length;
  return (edge.weight ?? 0) / total;
}

function cacheHitRateForDatabases(
  nodes: SimNode[],
  edges: SimEdge[],
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const edge of edges) {
    const src = nodes.find((n) => n.id === edge.source);
    const tgt = nodes.find((n) => n.id === edge.target);
    if (src?.type === "cache" && tgt?.type === "database") {
      map[tgt.id] = src.config.hit_rate ?? 0.8;
    }
  }
  return map;
}

interface RunResult {
  nodeResults: NodeResult[];
  totalLatency: number;
  throughput: number;
  bottleneckId: string | null;
  errorRate: number;
}

function runSimulation(
  nodes: SimNode[],
  edges: SimEdge[],
  traffic: number,
  failures: Failure[],
): RunResult {
  const sorted = topologicalSort(nodes, edges);
  const adj = buildAdjacencyList(edges);
  const outgoing = buildOutgoingMap(edges);
  const dbHitRate = cacheHitRateForDatabases(nodes, edges);

  const failureByNode: Record<string, Failure> = {};
  for (const f of failures) failureByNode[f.node_id] = f;

  const demand: Record<string, number> = {};
  const outputFlow: Record<string, number> = {};
  const capacityAfterFailure: Record<string, number> = {};
  const latencyAfterFailure: Record<string, number> = {};
  const pathLatency: Record<string, number> = {};

  for (const node of sorted) {
    // Inbound demand (raw, unconstrained)
    let inbound: number;
    if (node.type === "client") {
      inbound = traffic;
    } else {
      inbound = 0;
      for (const edge of edges) {
        if (edge.target !== node.id) continue;
        const siblings = outgoing[edge.source] || [];
        const w = edgeWeight(edge, siblings);
        inbound += (outputFlow[edge.source] ?? 0) * w;
      }
      if (node.type === "database" && dbHitRate[node.id] !== undefined) {
        inbound *= 1 - dbHitRate[node.id];
      }
    }
    demand[node.id] = inbound;

    // Capacity / latency (with failures applied)
    const raw = getCapacity(node);
    const { capacity, latency } = applyFailure(
      raw.capacity_rps,
      raw.latency_ms,
      failureByNode[node.id],
    );
    capacityAfterFailure[node.id] = capacity;
    latencyAfterFailure[node.id] = latency;

    // Output to downstream: clamped to capacity, reduced by partial_failure
    let output = node.type === "client" ? inbound : Math.min(inbound, capacity);
    const f = failureByNode[node.id];
    if (f?.type === "partial_failure") {
      output *= 1 - (f.error_percent ?? 10) / 100;
    }
    outputFlow[node.id] = output;
  }

  // Bottleneck detection (first saturated node in topo order)
  let bottleneckRatio = 1;
  let bottleneckId: string | null = null;
  for (const node of sorted) {
    if (node.type === "client") continue;
    const d = demand[node.id];
    const c = capacityAfterFailure[node.id];
    if (d <= 0) continue;
    if (c === Infinity) continue;
    if (c <= 0) {
      // node_down — hard bottleneck
      if (bottleneckId === null) bottleneckId = node.id;
      bottleneckRatio = 0;
      continue;
    }
    const ratio = c / d;
    if (ratio < 1 && bottleneckId === null) bottleneckId = node.id;
    if (ratio < bottleneckRatio) bottleneckRatio = ratio;
  }

  // Partial failure compounding (multiplicative)
  let partialSurvive = 1;
  for (const f of failures) {
    if (f.type === "partial_failure") {
      partialSurvive *= 1 - (f.error_percent ?? 10) / 100;
    }
  }

  const surviveRatio = Math.max(0, bottleneckRatio) * partialSurvive;
  const errorRate = Math.max(0, Math.min(100, (1 - surviveRatio) * 100));
  const throughput = Math.round(traffic * surviveRatio);

  // Per-node results + critical-path latency
  const nodeResults: NodeResult[] = [];
  let totalLatency = 0;

  for (const node of sorted) {
    if (node.type === "client") {
      pathLatency[node.id] = 0;
      nodeResults.push({
        id: node.id,
        type: node.type,
        capacity_rps: Infinity,
        utilization_percent: 0,
        latency_contribution_ms: 0,
        queue_wait_ms: 0,
        effective_rps: demand[node.id],
        is_bottleneck: false,
      });
      continue;
    }

    const d = demand[node.id];
    const cap = capacityAfterFailure[node.id];
    const lat = latencyAfterFailure[node.id];

    // M/M/c queue wait using raw demand
    let queueWaitMs = 0;
    if (cap > 0 && cap !== Infinity && d > 0) {
      const rho = Math.min(0.999, d / cap);
      queueWaitMs = (rho / (cap * (1 - rho))) * 1000;
    }

    // Cache latency blending
    let nodeLatency = lat;
    if (node.type === "cache") {
      const hitRate = node.config.hit_rate ?? 0.8;
      const cacheLat = node.config.read_latency_ms ?? 1;
      const targets = adj[node.id] || [];
      const dbNode = nodes.find(
        (n) => targets.includes(n.id) && n.type === "database",
      );
      if (dbNode) {
        const dbReadMs = dbNode.config.read_latency_ms ?? 5;
        nodeLatency = hitRate * cacheLat + (1 - hitRate) * dbReadMs;
      }
    }

    const localTotal = nodeLatency + queueWaitMs;

    // Critical path: this node + worst predecessor path
    let predMax = 0;
    for (const edge of edges) {
      if (edge.target === node.id) {
        predMax = Math.max(predMax, pathLatency[edge.source] ?? 0);
      }
    }
    pathLatency[node.id] = predMax + localTotal;
    if (pathLatency[node.id] > totalLatency) totalLatency = pathLatency[node.id];

    const utilization =
      cap > 0 && cap !== Infinity ? (d / cap) * 100 : cap === 0 && d > 0 ? 100 : 0;
    const isBottleneck =
      node.id === bottleneckId || (cap === 0 && d > 0);
    const effectiveRps =
      isBottleneck && cap !== Infinity ? cap : d;
    const failureMode: FailureType | undefined = failureByNode[node.id]?.type;

    nodeResults.push({
      id: node.id,
      type: node.type,
      capacity_rps: cap === Infinity ? 0 : Math.round(cap),
      utilization_percent: Math.round(utilization),
      latency_contribution_ms: Math.round(localTotal * 100) / 100,
      queue_wait_ms: Math.round(queueWaitMs * 100) / 100,
      effective_rps: Math.round(effectiveRps),
      is_bottleneck: isBottleneck,
      ...(failureMode ? { failure_mode: failureMode } : {}),
    });
  }

  return {
    nodeResults,
    totalLatency: Math.round(totalLatency * 100) / 100,
    throughput: Math.min(throughput, traffic),
    bottleneckId,
    errorRate: Math.round(errorRate * 100) / 100,
  };
}

export function simulate(
  nodes: SimNode[],
  edges: SimEdge[],
  traffic: number,
  failures: Failure[] = [],
): SimulationResponse {
  const run = runSimulation(nodes, edges, traffic, failures);

  const scaleProjection: ScalePoint[] = SCALE_TRAFFIC_LEVELS.map((t) => {
    const r = runSimulation(nodes, edges, t, failures);
    return {
      traffic_rps: t,
      latency_ms: r.totalLatency,
      throughput_rps: r.throughput,
      bottleneck: r.bottleneckId,
    };
  });

  return {
    summary: {
      total_latency_ms: run.totalLatency,
      throughput_rps: run.throughput,
      error_rate_percent: run.errorRate,
      bottleneck_node_id: run.bottleneckId,
    },
    nodes: run.nodeResults,
    scale_projection: scaleProjection,
  };
}
