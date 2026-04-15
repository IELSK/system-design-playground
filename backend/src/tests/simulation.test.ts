import { calcLoadBalancer } from "../services/simulation/nodes/loadBalancer";
import { calcApiServer } from "../services/simulation/nodes/apiServer";
import { calcQueue } from "../services/simulation/nodes/queue";
import { calcDatabase } from "../services/simulation/nodes/database";
import { calcCache } from "../services/simulation/nodes/cache";
import { simulate } from "../services/simulation";
import { topologicalSort } from "../services/simulation/graph";
import { SimNode } from "../services/simulation/types";

describe("Node capacity calculators", () => {
  it("loadBalancer: capacity = instances * (1000 / overhead_ms)", () => {
    const result = calcLoadBalancer({ instances: 2, overhead_ms: 1 });
    expect(result.capacity_rps).toBe(2000);
    expect(result.latency_ms).toBe(1);
  });

  it("apiServer: capacity = instances * max_rps_per_instance", () => {
    const result = calcApiServer({ instances: 4, processing_ms: 20, max_rps_per_instance: 500 });
    expect(result.capacity_rps).toBe(2000);
    expect(result.latency_ms).toBe(20);
  });

  it("queue: capacity mirrors the configured buffer size", () => {
    const result = calcQueue({ capacity: 10000, workers: 4, processing_ms: 50 });
    expect(result.capacity_rps).toBe(10000);
    expect(result.latency_ms).toBe(1);
  });

  it("database: capacity = max_connections * (1000 / avg_query_ms)", () => {
    const result = calcDatabase({ read_latency_ms: 5, write_latency_ms: 10, max_connections: 200 });
    // avg = 7.5ms, capacity = 200 * (1000/7.5) ≈ 26666.67
    expect(result.capacity_rps).toBeCloseTo(26666.67, 0);
    expect(result.latency_ms).toBe(5);
  });

  it("cache: capacity is ~100k rps", () => {
    const result = calcCache({ hit_rate: 0.8, read_latency_ms: 1 });
    expect(result.capacity_rps).toBe(100000);
    expect(result.latency_ms).toBe(1);
  });
});

describe("topologicalSort", () => {
  it("sorts nodes from client to database", () => {
    const nodes = [
      { id: "n3", type: "api", config: {} },
      { id: "n1", type: "client", config: {} },
      { id: "n2", type: "load_balancer", config: {} },
    ];
    const edges = [
      { source: "n1", target: "n2" },
      { source: "n2", target: "n3" },
    ];
    const sorted = topologicalSort(nodes, edges);
    expect(sorted.map((n) => n.id)).toEqual(["n1", "n2", "n3"]);
  });
});

describe("simulate", () => {
  const baseNodes: SimNode[] = [
    { id: "n1", type: "client", config: { rps: 5000 } },
    { id: "n2", type: "load_balancer", config: { instances: 10, overhead_ms: 1 } },
    { id: "n3", type: "api", config: { instances: 4, processing_ms: 20, max_rps_per_instance: 500 } },
    { id: "n4", type: "cache", config: { hit_rate: 0.8, read_latency_ms: 1 } },
    { id: "n5", type: "database", config: { read_latency_ms: 5, write_latency_ms: 10, max_connections: 200 } },
  ];

  const baseEdges = [
    { source: "n1", target: "n2" },
    { source: "n2", target: "n3" },
    { source: "n3", target: "n4" },
    { source: "n4", target: "n5" },
  ];

  it("detects bottleneck when traffic exceeds API capacity", () => {
    const result = simulate(baseNodes, baseEdges, 5000);

    expect(result.summary.bottleneck_node_id).toBe("n3");
    expect(result.summary.throughput_rps).toBe(2000);
    expect(result.summary.error_rate_percent).toBeGreaterThan(0);
  });

  it("no bottleneck when traffic is under capacity", () => {
    const result = simulate(baseNodes, baseEdges, 500);

    expect(result.summary.bottleneck_node_id).toBeNull();
    expect(result.summary.throughput_rps).toBe(500);
    expect(result.summary.error_rate_percent).toBe(0);
  });

  it("returns scale_projection with 7 traffic levels", () => {
    const result = simulate(baseNodes, baseEdges, 1000);

    expect(result.scale_projection).toHaveLength(7);
    expect(result.scale_projection[0].traffic_rps).toBe(100);
    expect(result.scale_projection[6].traffic_rps).toBe(20000);
  });

  it("scale_projection shows bottleneck appearing at high traffic", () => {
    const result = simulate(baseNodes, baseEdges, 1000);
    const projection = result.scale_projection;

    // At 500 rps: no bottleneck
    const low = projection.find((p) => p.traffic_rps === 500);
    expect(low?.bottleneck).toBeNull();

    // At 5000 rps: API becomes bottleneck
    const high = projection.find((p) => p.traffic_rps === 5000);
    expect(high?.bottleneck).toBe("n3");
  });

  it("cache reduces effective lambda to database", () => {
    const result = simulate(baseNodes, baseEdges, 1000);
    const dbResult = result.nodes.find((n) => n.id === "n5");

    // With 80% hit rate and 1000 rps, effective lambda to DB should be ~200
    // utilization should be low
    expect(dbResult!.utilization_percent).toBeLessThan(10);
  });

  it("splits traffic across branching outgoing edges", () => {
    // API branches: 70% to cache/db read path, 30% to queue/worker/db write path
    const branchNodes: SimNode[] = [
      { id: "c", type: "client", config: { rps: 1000 } },
      { id: "api", type: "api", config: { instances: 10, processing_ms: 20, max_rps_per_instance: 500 } },
      { id: "cache", type: "cache", config: { hit_rate: 0.8, read_latency_ms: 1 } },
      { id: "q", type: "queue", config: { capacity: 10000, workers: 4, processing_ms: 50 } },
      { id: "w", type: "worker", config: { instances: 4, processing_ms: 100, concurrency: 10 } },
      { id: "db", type: "database", config: { read_latency_ms: 5, write_latency_ms: 10, max_connections: 200 } },
    ];
    const branchEdges = [
      { source: "c", target: "api" },
      { source: "api", target: "cache", weight: 70 },
      { source: "api", target: "q", weight: 30 },
      { source: "cache", target: "db" },
      { source: "q", target: "w" },
      { source: "w", target: "db" },
    ];

    const result = simulate(branchNodes, branchEdges, 1000);

    const api = result.nodes.find((n) => n.id === "api")!;
    const cache = result.nodes.find((n) => n.id === "cache")!;
    const worker = result.nodes.find((n) => n.id === "w")!;

    // API sees full 1000
    expect(api.effective_rps).toBe(1000);
    // Cache sees 70% of 1000 = 700
    expect(cache.effective_rps).toBe(700);
    // Worker sees 30% of 1000 = 300
    expect(worker.effective_rps).toBe(300);
  });

  it("defaults to even split when edge weights are not provided", () => {
    const nodes: SimNode[] = [
      { id: "c", type: "client", config: { rps: 1000 } },
      { id: "api", type: "api", config: { instances: 10, processing_ms: 20, max_rps_per_instance: 500 } },
      { id: "db1", type: "database", config: { read_latency_ms: 5, write_latency_ms: 10, max_connections: 200 } },
      { id: "db2", type: "database", config: { read_latency_ms: 5, write_latency_ms: 10, max_connections: 200 } },
    ];
    const edges = [
      { source: "c", target: "api" },
      { source: "api", target: "db1" },
      { source: "api", target: "db2" },
    ];
    const result = simulate(nodes, edges, 1000);
    const db1 = result.nodes.find((n) => n.id === "db1")!;
    const db2 = result.nodes.find((n) => n.id === "db2")!;
    expect(db1.effective_rps).toBe(500);
    expect(db2.effective_rps).toBe(500);
  });

  it("node_down failure forces bottleneck and zero throughput", () => {
    const result = simulate(baseNodes, baseEdges, 500, [
      { node_id: "n3", type: "node_down" },
    ]);
    expect(result.summary.bottleneck_node_id).toBe("n3");
    expect(result.summary.throughput_rps).toBe(0);
    expect(result.summary.error_rate_percent).toBe(100);
    const api = result.nodes.find((n) => n.id === "n3")!;
    expect(api.failure_mode).toBe("node_down");
    expect(api.is_bottleneck).toBe(true);
  });

  it("slow_response failure multiplies node latency", () => {
    const normal = simulate(baseNodes, baseEdges, 500);
    const slow = simulate(baseNodes, baseEdges, 500, [
      { node_id: "n3", type: "slow_response", factor: 5 },
    ]);
    expect(slow.summary.total_latency_ms).toBeGreaterThan(
      normal.summary.total_latency_ms,
    );
    const api = slow.nodes.find((n) => n.id === "n3")!;
    expect(api.failure_mode).toBe("slow_response");
  });

  it("partial_failure reduces throughput by error_percent", () => {
    const result = simulate(baseNodes, baseEdges, 500, [
      { node_id: "n3", type: "partial_failure", error_percent: 20 },
    ]);
    expect(result.summary.throughput_rps).toBe(400);
    expect(result.summary.error_rate_percent).toBeCloseTo(20, 0);
  });

  it("capacity_degraded shrinks available capacity", () => {
    const result = simulate(baseNodes, baseEdges, 1500, [
      { node_id: "n3", type: "capacity_degraded", percent: 50 },
    ]);
    // API capacity drops from 2000 to 1000, so 1500 demand saturates it
    expect(result.summary.bottleneck_node_id).toBe("n3");
    expect(result.summary.throughput_rps).toBe(1000);
  });

  it("all node results include expected fields", () => {
    const result = simulate(baseNodes, baseEdges, 1000);

    for (const node of result.nodes) {
      expect(node).toHaveProperty("id");
      expect(node).toHaveProperty("type");
      expect(node).toHaveProperty("capacity_rps");
      expect(node).toHaveProperty("utilization_percent");
      expect(node).toHaveProperty("latency_contribution_ms");
      expect(node).toHaveProperty("queue_wait_ms");
      expect(node).toHaveProperty("effective_rps");
      expect(node).toHaveProperty("is_bottleneck");
    }
  });
});
