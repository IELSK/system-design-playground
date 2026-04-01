import axios from "axios";

// Centralized Axios instance.
// Every API call in the app should use this export.
//
// baseURL "/api" works with the Vite proxy:
//   /api/health → localhost:3333/health
//
// In Phase 02 we'll add interceptors here to:
// 1. Automatically inject the Bearer token in the Authorization header
// 2. Intercept 401 responses, attempt POST /auth/refresh,
//    and replay the original request with the new access token
//
// withCredentials: true makes the browser send cookies on every
// request — required for the httpOnly refresh token.
const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

export default api;
