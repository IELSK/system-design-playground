import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { healthRouter } from "./routes/health";

// dotenv.config() reads the .env file and injects variables into process.env.
// Must be called BEFORE any access to process.env.
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3333;

// ---------------------------------------------------------------
// Global middlewares
// ---------------------------------------------------------------

// express.json() is a built-in body parser (since Express 4.16+).
// It reads the request body when Content-Type is application/json
// and places the parsed object in req.body.
app.use(express.json());

// CORS (Cross-Origin Resource Sharing):
// Browsers block requests from one origin (localhost:5173) to
// another (localhost:3333) by default. The cors middleware adds
// the Access-Control-Allow-Origin headers so the frontend can
// communicate with the backend.
//
// origin: restricts access to the frontend domain only.
// credentials: true allows cookies to be sent (required for the
// httpOnly refresh token we'll implement in Phase 02).
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

// ---------------------------------------------------------------
// Routes
// ---------------------------------------------------------------
app.use(healthRouter);

// ---------------------------------------------------------------
// Server startup
// ---------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});

export default app;
