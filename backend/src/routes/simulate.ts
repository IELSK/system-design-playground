import { Router, Request, Response } from "express";
import { simulate } from "../services/simulation";
import { SimulationRequest } from "../services/simulation/types";

const simulateRouter = Router();

simulateRouter.post("/simulate", (req: Request, res: Response) => {
  try {
    const { traffic, nodes, edges, failures } = req.body as SimulationRequest;

    if (!nodes || !edges || traffic === undefined) {
      res.status(400).json({ error: "traffic, nodes, and edges are required" });
      return;
    }

    if (nodes.length === 0) {
      res.status(400).json({ error: "At least one node is required" });
      return;
    }

    const result = simulate(nodes, edges, traffic, failures || []);
    res.json(result);
  } catch (err) {
    console.error("Simulation error:", err);
    res.status(500).json({ error: "Simulation failed" });
  }
});

export { simulateRouter };
