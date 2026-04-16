import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { healthRouter } from "./routes/health";
import { authRouter } from "./routes/auth";
import { simulateRouter } from "./routes/simulate";
import { costRouter } from "./routes/cost";
import { architectureRouter } from "./routes/architecture";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(healthRouter);
app.use(authRouter);
app.use(simulateRouter);
app.use(costRouter);
app.use(architectureRouter);

export default app;
