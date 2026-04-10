// AWS on-demand pricing (us-east-1), approximate values in USD.
// Updated reference: https://aws.amazon.com/pricing/ — snapshot, not live.

export const HOURS_PER_MONTH = 730;

export interface PriceEntry {
  hourly: number;
  resource: string;
}

// API Server — EC2 t3.medium (2 vCPU, 4 GB)
export const API_SERVER: PriceEntry = {
  hourly: 0.0416,
  resource: "EC2 t3.medium",
};

// Worker — EC2 t3.small (2 vCPU, 2 GB)
export const WORKER: PriceEntry = {
  hourly: 0.0208,
  resource: "EC2 t3.small",
};

// Database — RDS db.t3.medium
export const DATABASE: PriceEntry = {
  hourly: 0.068,
  resource: "RDS db.t3.medium",
};

// Cache — ElastiCache cache.t3.micro
export const CACHE: PriceEntry = {
  hourly: 0.017,
  resource: "ElastiCache cache.t3.micro",
};

// Load Balancer — ALB (base hourly, LCU omitted for simplicity)
export const LOAD_BALANCER: PriceEntry = {
  hourly: 0.0225,
  resource: "Application Load Balancer",
};

// Queue — SQS standard ($0.40 per 1M requests)
// Modeled as a flat "minimal" hourly cost since SQS scales with messages,
// not with provisioned capacity. Real cost depends on traffic.
export const QUEUE: PriceEntry = {
  hourly: 0.0005,
  resource: "SQS Standard",
};
