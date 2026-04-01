import { Router, Request, Response } from "express";

const healthRouter = Router();

healthRouter.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", version: "1.0" });
});

export { healthRouter };
