import { SimNode } from "../simulation/types";
import {
  CostEstimateResponse,
  NodeCostBreakdown,
} from "./types";
import {
  HOURS_PER_MONTH,
  API_SERVER,
  WORKER,
  DATABASE,
  CACHE,
  LOAD_BALANCER,
  QUEUE,
  PriceEntry,
} from "./pricing";

interface NodeCost {
  price: PriceEntry;
  instances: number;
}

function resolveNodeCost(node: SimNode): NodeCost | null {
  switch (node.type) {
    case "api":
      return { price: API_SERVER, instances: node.config.instances || 1 };
    case "worker":
      return { price: WORKER, instances: node.config.instances || 1 };
    case "database":
      // Databases typically run as single primary; treat as 1 unit.
      return { price: DATABASE, instances: 1 };
    case "cache":
      return { price: CACHE, instances: 1 };
    case "load_balancer":
      return { price: LOAD_BALANCER, instances: node.config.instances || 1 };
    case "queue":
      return { price: QUEUE, instances: 1 };
    default:
      return null; // client has no cost
  }
}

export function estimateCost(nodes: SimNode[]): CostEstimateResponse {
  const breakdown: NodeCostBreakdown[] = [];
  let total = 0;

  for (const node of nodes) {
    const cost = resolveNodeCost(node);
    if (!cost) continue;

    const monthly = cost.price.hourly * cost.instances * HOURS_PER_MONTH;
    const rounded = Math.round(monthly * 100) / 100;

    breakdown.push({
      node_id: node.id,
      type: node.type,
      instances: cost.instances,
      unit_price_hourly: cost.price.hourly,
      monthly_usd: rounded,
      resource: cost.price.resource,
    });

    total += rounded;
  }

  return {
    total_monthly_usd: Math.round(total * 100) / 100,
    breakdown,
    disclaimer:
      "Approximate estimate based on AWS on-demand prices (us-east-1). Real costs depend on traffic, data transfer, storage, and reserved pricing.",
  };
}
