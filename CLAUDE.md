# CLAUDE.md — System Design Playground

## Project Overview

A visual tool for modeling and simulating distributed system architectures using queuing theory (M/M/c), bottleneck detection, and scale projection. Users drag-and-drop infrastructure components onto a canvas, connect them, configure parameters, and run simulations to identify bottlenecks and understand system behavior under load.

## Tech Stack

### Backend
- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL (via Docker)
- JWT authentication (access token 15min + refresh token 7d in httpOnly cookie)
- bcrypt for password hashing (saltRounds: 12)
- Jest + Supertest for testing

### Frontend
- React 19 + Vite + TypeScript
- React Flow (@xyflow/react) for the architecture canvas
- Tailwind CSS for styling
- Axios with interceptors (token injection + 401 refresh)
- React Router v7
- Recharts for dashboard charts

## Project Structure

```
system-design-playground/
├── backend/
│   ├── src/
│   │   ├── app.ts              # Express app setup (separated from listen for testability)
│   │   ├── index.ts            # Entry point: dotenv + listen
│   │   ├── lib/
│   │   │   ├── AppError.ts     # Custom error class with HTTP status code
│   │   │   ├── cookies.ts      # httpOnly refresh token cookie helpers
│   │   │   └── prisma.ts       # Prisma singleton (cached on globalThis for hot-reload)
│   │   ├── middlewares/
│   │   │   └── authGuard.ts    # JWT validation, injects req.user
│   │   ├── routes/
│   │   │   ├── auth.ts         # POST register/login/refresh/logout, GET me
│   │   │   ├── health.ts       # GET /health
│   │   │   └── simulate.ts     # POST /simulate
│   │   ├── services/
│   │   │   ├── auth.ts         # Auth business logic (register, login, refresh, logout, verify)
│   │   │   └── simulation/
│   │   │       ├── index.ts    # Main simulation engine (M/M/c, topological traversal)
│   │   │       ├── graph.ts    # Adjacency list + topological sort via BFS
│   │   │       ├── types.ts    # SimNode, SimEdge, NodeResult, SimulationResponse, etc.
│   │   │       └── nodes/
│   │   │           ├── base.ts          # CapacityResult interface
│   │   │           ├── apiServer.ts     # capacity = instances × max_rps_per_instance
│   │   │           ├── cache.ts         # capacity ≈ 100k (practically unlimited)
│   │   │           ├── database.ts      # capacity = max_connections × (1000 / avg_query_ms)
│   │   │           ├── loadBalancer.ts  # capacity = instances × (1000 / overhead_ms)
│   │   │           └── queue.ts         # capacity = queue capacity (buffer only)
│   │   └── tests/
│   │       ├── setup.ts          # Loads dotenv
│   │       ├── auth.test.ts      # 14 integration tests against real PostgreSQL
│   │       └── simulation.test.ts # Unit tests for calculators + full simulation
│   ├── prisma/
│   │   └── schema.prisma    # User, RefreshToken, Architecture models
│   ├── jest.config.ts
│   ├── tsconfig.json
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # BrowserRouter + AuthProvider + routes
│   │   ├── main.tsx             # ReactDOM entry
│   │   ├── index.css            # Tailwind + React Flow dark theme overrides
│   │   ├── types/
│   │   │   ├── nodes.ts         # NodeType, NodeConfig interfaces, defaults, colors, labels
│   │   │   └── simulation.ts    # NodeResult, ScalePoint, SimulationResponse (mirrors backend)
│   │   ├── components/
│   │   │   ├── PrivateRoute.tsx  # Redirects to /login if not authenticated
│   │   │   ├── nodes/
│   │   │   │   └── ArchitectureNode.tsx  # Custom React Flow node (all 7 types)
│   │   │   ├── editor/
│   │   │   │   ├── Sidebar.tsx      # Draggable node palette (responsive, overlay on mobile)
│   │   │   │   ├── ConfigPanel.tsx  # Dynamic config inputs per node type
│   │   │   │   └── Toolbar.tsx      # Save/Load/Clear/Zoom/Fit/Simulate (with loading state)
│   │   │   └── dashboard/
│   │   │       ├── Dashboard.tsx        # Container: 40% right panel, scrollable
│   │   │       ├── SummaryCards.tsx      # 2×2 grid: latency, throughput, error rate, bottleneck
│   │   │       ├── LatencyChart.tsx      # Horizontal stacked bar chart (processing + queue wait)
│   │   │       ├── UtilizationBars.tsx   # Progress bars with color thresholds (green→red)
│   │   │       └── NodeDetailTable.tsx   # Table: capacity, effective rps, util%, latency per node
│   │   ├── hooks/
│   │   │   ├── useAuth.tsx              # AuthContext + AuthProvider (session restore via refresh)
│   │   │   ├── useConnectionValidator.ts # Prevents invalid connections (e.g. target=client)
│   │   │   └── useGraphStorage.ts       # localStorage save/load/clear
│   │   ├── pages/
│   │   │   ├── EditorPage.tsx    # Main editor canvas with React Flow + Dashboard integration
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   └── HomePage.tsx      # (unused, editor replaced it as / route)
│   │   └── services/
│   │       └── api.ts            # Axios instance with interceptors (Bearer injection + 401 refresh queue)
│   ├── vite.config.ts       # Proxy /api → localhost:3333
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
├── docker-compose.yml       # PostgreSQL 16 with healthcheck
├── eslint.config.mjs
├── .prettierrc
└── README.md
```

## Completed Phases

### Phase 01 — Project Setup ✓
- Docker Compose with PostgreSQL 16
- Prisma connected with initial migration (all 3 models created upfront)
- Backend GET /health endpoint
- Frontend Vite running and consuming health endpoint
- ESLint + Prettier configured
- CORS configured with credentials: true

### Phase 02 — Authentication ✓
- JWT access token (15min, in-memory on frontend) + refresh token (opaque UUID, 7 days, httpOnly cookie)
- Refresh token rotation: old token deleted on each refresh
- Routes: POST register/login/refresh/logout, GET /auth/me
- authGuard middleware (reusable for all protected routes)
- Axios interceptors: auto Bearer injection + 401 refresh with pending queue
- AuthContext with session restore on page load (useRef guard for StrictMode)
- PrivateRoute component
- Login and Register pages
- 14 integration tests with Supertest

### Phase 03 — Architecture Editor ✓
- 7 node types: Client, Load Balancer, API Server, Queue, Worker, Database, Cache
- Drag-and-drop from sidebar to canvas via HTML5 drag API
- ConfigPanel with dynamic inputs per node type
- Connection validation (client can't be target, no self-connections)
- Toolbar: Save, Load, Clear, Zoom, Fit View, Simulate
- Autosave to localStorage
- Responsive: sidebar and config panel are overlays on mobile
- React Flow controls styled for dark theme via CSS overrides

### Phase 04 — Simulation Engine ✓
- POST /simulate endpoint
- M/M/c queuing theory: utilization (ρ), queue wait time (Wq), saturation detection
- Topological sort via BFS for graph traversal
- Per-node capacity calculators
- Cache reduces effective λ to Database: λ_effective = λ × (1 - hit_rate)
- Queue treated as buffer (capacity = queue capacity), Worker does actual processing
- scale_projection: same simulation run at [100, 500, 1k, 2k, 5k, 10k, 20k] req/s
- Bottleneck node highlighted with red border + pulse animation on canvas
- Unit tests for all calculators + full simulation scenarios

### Phase 05 — Performance Dashboard ✓
- SummaryCards: 2×2 grid with Total Latency, Throughput, Error Rate, Bottleneck
- LatencyChart: horizontal stacked bar chart (Recharts) — processing + queue wait per node
- UtilizationBars: progress bars with color thresholds (green < 60% < yellow < 80% < amber < 100% = red)
- NodeDetailTable: capacity, effective rps, utilization%, latency per node
- Dashboard container: 40% right panel, scrollable, closeable
- ConfigPanel opens over Dashboard when clicking a node (both visible simultaneously)
- Simulate button shows loading state ("Simulating...") and disables during request
- Tooltip styled for dark theme with consistent gray palette

## Remaining Phases

### Phase 06 — Cost Simulator
- POST /cost-estimate endpoint
- AWS pricing model (EC2, RDS, ElastiCache, SQS, ALB)
- Monthly cost breakdown by node
- Disclaimer about approximate values

### Phase 07 — Failure Simulation + Branching Traffic
- Failure types: node_down, slow_response, partial_failure, capacity_degraded
- failures[] array in POST /simulate payload (already defined in types)
- Failure mode panel with toggles per node
- Failed nodes shown in orange/red on canvas
- Dashboard compares normal vs failure metrics side by side
- **Branching traffic support**: the simulation engine currently only supports linear pipelines (single λ propagation). This phase should add support for nodes with multiple outgoing edges, splitting λ between branches. This enables realistic architectures like:
  ```
                      ┌→ Queue → Worker → Database  (writes / async)
  Client → LB → API ─┤
                      └→ Cache → Database            (reads)
  ```
  Requirements:
  - API Server (or any node) with 2+ outgoing edges splits traffic by configurable ratio (e.g. 70% reads / 30% writes)
  - Each branch computes independently with its own λ
  - Bottleneck detection works per-branch, worst branch determines system throughput
  - UI: edge labels showing traffic split percentage, configurable via edge click

### Phase 08 — Share Architecture
- CRUD for Architecture model (already in Prisma schema)
- POST/GET/PATCH/DELETE /architecture routes
- Public/private toggle
- Shareable link: /a/:id
- "My Architectures" listing page

### Phase 09 — Scale Simulation
- Consumes scale_projection already returned by Phase 04
- Line charts: req/s × latency, req/s × error rate
- Bottleneck timeline
- Interactive traffic slider
- Auto-generated scaling recommendations
- Cost × scale projection (combines Phase 06 + scale_projection)
- Almost entirely frontend — no new backend routes needed

## Key Technical Decisions

### Authentication
- Access token in JS memory (not localStorage) to prevent XSS theft
- Refresh token as httpOnly cookie (invisible to JS, prevents XSS)
- Refresh token rotation (old deleted on use, limits leaked token damage)
- Generic error message on login failure prevents email enumeration
- app.ts separated from index.ts so Supertest can import without triggering listen()
- useRef guard in AuthProvider's useEffect prevents double refresh in React StrictMode

### Simulation Engine
- Queue is a buffer only (high capacity, low latency). Worker does actual processing with concurrency.
- API Server capacity = instances × max_rps_per_instance. The processing_ms only affects latency, not capacity. This is because max_rps_per_instance represents a benchmark/real-world limit that already accounts for processing time, concurrency model (sync/async), etc.
- Cache is treated as practically unlimited (~100k rps). Its role is reducing λ to the Database via hit_rate.
- The first node in topological order that saturates (ρ ≥ 1) is the bottleneck. Traffic downstream is clamped to that node's capacity.
- **Current limitation**: engine only supports linear pipelines. Branching traffic (multiple outgoing edges splitting λ) is planned for Phase 07.

### Frontend
- Single custom React Flow node type (`architecture`) handles all 7 node types via data.nodeType
- ReactFlowProvider wraps EditorCanvas in a separate parent component because useReactFlow() hook needs to be called inside the provider's children
- NodeData requires `[key: string]: unknown` index signature for React Flow compatibility
- Sidebar uses HTML5 drag-and-drop API (dataTransfer) — React Flow doesn't have built-in sidebar-to-canvas drag
- Dashboard opens on simulate, ConfigPanel overlays on node click (both can coexist)

## Code Style Rules
- All code (variables, comments, file names) must be in English
- Minimal comments — only where truly necessary
- Explanations happen in conversation, not in code

## Commands

```bash
# PostgreSQL
docker compose up -d

# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev          # http://localhost:3333
npm test             # Jest (needs PostgreSQL running)

# Frontend
cd frontend
npm install
npm run dev          # http://localhost:5173
```

## Environment Variables (backend/.env)

```
DATABASE_URL="postgresql://sdp:sdp@localhost:5432/sdp"
JWT_SECRET="troque-por-um-segredo-forte"
JWT_REFRESH_SECRET="outro-segredo-para-refresh"
PORT=3333
CORS_ORIGIN="http://localhost:5173"
```
