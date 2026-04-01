import { Router, Request, Response } from "express";
import { register, login, refresh, logout, getMe } from "../services/auth";
import { AppError } from "../lib/AppError";
import { setRefreshCookie, clearRefreshCookie, getRefreshCookieName } from "../lib/cookies";
import { authGuard } from "../middlewares/authGuard";

const authRouter = Router();

authRouter.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      res.status(400).json({ error: "Email, name, and password are required" });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }

    const { user, tokens } = await register(email, name, password);
    setRefreshCookie(res, tokens.refreshToken);
    res.status(201).json({ user, accessToken: tokens.accessToken });
  } catch (err) {
    handleError(res, err);
  }
});

authRouter.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const { user, tokens } = await login(email, password);
    setRefreshCookie(res, tokens.refreshToken);
    res.json({ user, accessToken: tokens.accessToken });
  } catch (err) {
    handleError(res, err);
  }
});

authRouter.post("/auth/refresh", async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.[getRefreshCookieName()];
    if (!token) {
      res.status(401).json({ error: "No refresh token provided" });
      return;
    }

    const tokens = await refresh(token);
    setRefreshCookie(res, tokens.refreshToken);
    res.json({ accessToken: tokens.accessToken });
  } catch (err) {
    clearRefreshCookie(res);
    handleError(res, err);
  }
});

authRouter.post("/auth/logout", async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.[getRefreshCookieName()];
    if (token) await logout(token);
    clearRefreshCookie(res);
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    handleError(res, err);
  }
});

authRouter.get("/auth/me", authGuard, async (req: Request, res: Response) => {
  try {
    const user = await getMe(req.user!.sub);
    res.json({ user });
  } catch (err) {
    handleError(res, err);
  }
});

function handleError(res: Response, err: unknown): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  console.error("Unexpected error:", err);
  res.status(500).json({ error: "Internal server error" });
}

export { authRouter };
