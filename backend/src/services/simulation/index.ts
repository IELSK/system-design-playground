import { SimNode, SimEdge, NodeResult, SimulationResponse, ScalePoint } from "./types";
import { topologicalSort, buildAdjacencyList } from "./graph";
import { CapacityResult } from "./nodes/base";
import { calcLoadBalancer } from "./nodes/loadBalancer";
import { calcApiServer } from "./nodes/apiServer";
import { calcQueue } from "./nodes/queue";
import { calcDatabase } from "./nodes/database";
import { calcCache } from "./nodes/cache";

const SCALE_TRAFFIC_LEVELS = [100, 500, 1000, 2000, 5000, 10000, 20000];

function getCapacity(node: SimNode): CapacityResult {
  switch (node.type) {
    case "load_balancer": return calcLoadBalancer(node.config);
    case "api":           return calcApiServer(node.config);
    case "queue":         return calcQueue(node.config);
    case "worker":        return calcQueue(node.config); // same formula
    case "database":      return calcDatabase(node.config);
    case "cache":         return calcCache(node.config);
    default:              return { capacity_rps: Infinity, latency_ms: 0 };
  }
}

function findCacheHitRate(
  nodes: SimNode[],
  edges: SimEdge[],
  dbId: string,
): number | null {
  // Check if any cache node points to this database
  for (const edge of edges) {
    if (edge.target === dbId) {
      const source = nodes.find((n) => n.id === edge.source);
      if (source && source.type === "cache") {
        return source.config.hit_rate ?? 0.8;
      }
    }
  }
  return null;
}

function runSimulation(
  nodes: SimNode[],
  edges: SimEdge[],
  traffic: number,
): { nodeResults: NodeResult[]; totalLatency: number; throughput: number; bottleneckId: string | null } {
  const sorted = topologicalSort(nodes, edges);
  const adj = buildAdjacencyList(edges);
  const nodeResults: NodeResult[] = [];

  let lambda = traffic;
  let totalLatency = 0;
  let throughput = traffic;
  let bottleneckId: string | null = null;

  for (const node of sorted) {
    if (node.type === "client") {
      nodeResults.push({
        id: node.id,
        type: node.type,
        capacity_rps: Infinity,
        utilization_percent: 0,
        latency_contribution_ms: 0,
        queue_wait_ms: 0,
        effective_rps: lambda,
        is_bottleneck: false,
      });
      continue;
    }

    const { capacity_rps, latency_ms } = getCapacity(node);

    // If cache sits before database, reduce effective lambda to db
    let effectiveLambda = lambda;
    if (node.type === "database") {
      const hitRate = findCacheHitRate(nodes, edges, node.id);
      if (hitRate !== null) {
        effectiveLambda = lambda * (1 - hitRate);
      }
    }

    const rho = effectiveLambda / capacity_rps;
    const isBottleneck = rho >= 1;
    let queueWaitMs = 0;

    if (!isBottleneck && rho > 0) {
      // M/M/c simplified: Wq = rho / (capacity_rps * (1 - rho))
      const wqSeconds = rho / (capacity_rps * (1 - rho));
      queueWaitMs = wqSeconds * 1000;
    }

    const latencyContribution = latency_ms + queueWaitMs;

    // Cache latency blending: hit_rate * cache_ms + (1 - hit_rate) * db_read_ms
    let finalLatency = latencyContribution;
    if (node.type === "cache") {
      const hitRate = node.config.hit_rate ?? 0.8;
      const cacheLat = node.config.read_latency_ms ?? 1;
      // Find the next node (database) to get its read latency
      const targets = adj[node.id] || [];
      const dbNode = nodes.find((n) => targets.includes(n.id) && n.type === "database");
      if (dbNode) {
        const dbReadMs = dbNode.config.read_latency_ms ?? 5;
        finalLatency = hitRate * cacheLat + (1 - hitRate) * dbReadMs + queueWaitMs;
      }
    }

    totalLatency += finalLatency;

    const effectiveRps = isBottleneck ? capacity_rps : effectiveLambda;

    if (isBottleneck && !bottleneckId) {
      bottleneckId = node.id;
      throughput = Math.min(throughput, capacity_rps);
      lambda = capacity_rps;
    }

    nodeResults.push({
      id: node.id,
      type: node.type,
      capacity_rps: Math.round(capacity_rps),
      utilization_percent: Math.round(rho * 100),
      latency_contribution_ms: Math.round(finalLatency * 100) / 100,
      queue_wait_ms: Math.round(queueWaitMs * 100) / 100,
      effective_rps: Math.round(effectiveRps),
      is_bottleneck: isBottleneck,
    });
  }

  return {
    nodeResults,
    totalLatency: Math.round(totalLatency * 100) / 100,
    throughput: Math.round(Math.min(throughput, traffic)),
    bottleneckId,
  };
}

export function simulate(
  nodes: SimNode[],
  edges: SimEdge[],
  traffic: number,
): SimulationResponse {
  const { nodeResults, totalLatency, throughput, bottleneckId } = runSimulation(nodes, edges, traffic);

  const errorRate = traffic > 0
    ? Math.max(0, ((traffic - throughput) / traffic) * 100)
    : 0;

  const scaleProjection: ScalePoint[] = SCALE_TRAFFIC_LEVELS.map((t) => {
    const result = runSimulation(nodes, edges, t);
    return {
      traffic_rps: t,
      latency_ms: result.totalLatency,
      throughput_rps: result.throughput,
      bottleneck: result.bottleneckId,
    };
  });

  return {
    summary: {
      total_latency_ms: totalLatency,
      throughput_rps: throughput,
      error_rate_percent: Math.round(errorRate * 100) / 100,
      bottleneck_node_id: bottleneckId,
    },
    nodes: nodeResults,
    scale_projection: scaleProjection,
  };
}
