import { calcLoadBalancer } from "../services/simulation/nodes/loadBalancer";
import { calcApiServer } from "../services/simulation/nodes/apiServer";
import { calcQueue } from "../services/simulation/nodes/queue";
import { calcDatabase } from "../services/simulation/nodes/database";
import { calcCache } from "../services/simulation/nodes/cache";
import { simulate } from "../services/simulation";
import { topologicalSort } from "../services/simulation/graph";

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

  it("queue: capacity = workers * concurrency * (1000 / processing_ms)", () => {
    const result = calcQueue({ workers: 4, concurrency: 10, processing_ms: 50 });
    expect(result.capacity_rps).toBe(800);
    expect(result.latency_ms).toBe(50);
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
  const baseNodes = [
    { id: "n1", type: "client", config: { rps: 5000 } },
    { id: "n2", type: "load_balancer", config: { instances: 2, overhead_ms: 1 } },
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
