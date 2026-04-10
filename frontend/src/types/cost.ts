export interface NodeCostBreakdown {
  node_id: string;
  type: string;
  instances: number;
  unit_price_hourly: number;
  monthly_usd: number;
  resource: string;
}

export interface CostEstimateResponse {
  total_monthly_usd: number;
  breakdown: NodeCostBreakdown[];
  disclaimer: string;
}
