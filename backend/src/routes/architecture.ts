import { Router, Request, Response } from "express";
import { AppError } from "../lib/AppError";
import { authGuard } from "../middlewares/authGuard";
import {
  createArchitecture,
  listArchitectures,
  getArchitecture,
  getPublicArchitecture,
  updateArchitecture,
  deleteArchitecture,
} from "../services/architecture";

const architectureRouter = Router();

architectureRouter.get(
  "/architectures/public/:id",
  async (req: Request, res: Response) => {
    try {
      const arch = await getPublicArchitecture(String(req.params.id));
      res.json({ architecture: arch });
    } catch (err) {
      handleError(res, err);
    }
  },
);

architectureRouter.post(
  "/architectures",
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const arch = await createArchitecture(req.user!.sub, req.body);
      res.status(201).json({ architecture: arch });
    } catch (err) {
      handleError(res, err);
    }
  },
);

architectureRouter.get(
  "/architectures",
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const list = await listArchitectures(req.user!.sub);
      res.json({ architectures: list });
    } catch (err) {
      handleError(res, err);
    }
  },
);

architectureRouter.get(
  "/architectures/:id",
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const arch = await getArchitecture(req.user!.sub, String(req.params.id));
      res.json({ architecture: arch });
    } catch (err) {
      handleError(res, err);
    }
  },
);

architectureRouter.patch(
  "/architectures/:id",
  authGuard,
  async (req: Request, res: Response) => {
    try {
      const arch = await updateArchitecture(
        req.user!.sub,
        String(req.params.id),
        req.body,
      );
      res.json({ architecture: arch });
    } catch (err) {
      handleError(res, err);
    }
  },
);

architectureRouter.delete(
  "/architectures/:id",
  authGuard,
  async (req: Request, res: Response) => {
    try {
      await deleteArchitecture(req.user!.sub, String(req.params.id));
      res.status(204).send();
    } catch (err) {
      handleError(res, err);
    }
  },
);

function handleError(res: Response, err: unknown): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  console.error("Architecture route error:", err);
  res.status(500).json({ error: "Internal server error" });
}

export { architectureRouter };
