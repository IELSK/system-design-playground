import { Router, Request, Response } from "express";
import { estimateCost } from "../services/cost";
import { CostEstimateRequest } from "../services/cost/types";

const costRouter = Router();

costRouter.post("/cost-estimate", (req: Request, res: Response) => {
  try {
    const { nodes } = req.body as CostEstimateRequest;

    if (!nodes) {
      res.status(400).json({ error: "nodes is required" });
      return;
    }

    if (nodes.length === 0) {
      res.status(400).json({ error: "At least one node is required" });
      return;
    }

    const result = estimateCost(nodes);
    res.json(result);
  } catch (err) {
    console.error("Cost estimation error:", err);
    res.status(500).json({ error: "Cost estimation failed" });
  }
});

export { costRouter };
