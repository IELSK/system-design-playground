import { Router, Request, Response } from "express";

const healthRouter = Router();

// GET /health
// Unauthenticated route that serves two purposes:
// 1. Quick check that the server is running
// 2. Connectivity test for the frontend
//
// In production, health checks like this are consumed by load
// balancers (ALB, nginx) to decide whether an instance is
// healthy. If it returns anything other than 200, the LB
// removes the instance from the traffic pool.
healthRouter.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", version: "1.0" });
});

export { healthRouter };
