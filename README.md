# 🏗️ System Design Playground

A visual tool for modeling and simulating distributed system architectures. Drag-and-drop infrastructure components, connect them, configure parameters, and run simulations powered by M/M/c queuing theory to identify bottlenecks, project scaling behavior, and estimate costs.

---

## The Problem

Understanding how a distributed system behaves under load — where it bottlenecks, how latency compounds, when to scale — usually requires either expensive load testing on real infrastructure or years of intuition. This tool replaces that with interactive, visual simulation grounded in queuing theory math, letting you answer "what happens at 10k rps?" before writing a single line of infrastructure code.

---

## What It Does

The platform answers four core questions:

**Where does my system bottleneck?**
The simulation engine traverses the architecture graph in topological order, computing per-node utilization via M/M/c queuing theory. The first node to saturate (ρ ≥ 1) is highlighted on the canvas with a red pulse.

**How does my system scale?**
The same simulation runs at 7 traffic levels (100 → 20,000 rps), producing latency, throughput, error rate, and bottleneck curves. An interactive slider lets you explore each level, and auto-generated recommendations tell you what to scale and when.

**What happens when things break?**
Four failure modes (node down, slow response, partial failure, capacity degraded) can be applied per node. The engine recomputes with multiplicative error composition, showing how failures cascade through the pipeline.

**How much does it cost?**
An approximate AWS pricing model (EC2, RDS, ElastiCache, SQS, ALB) estimates monthly cost by node, and the scale analysis shows cost per 1M successful requests at each traffic level.

---

## Architecture

```
system-design-playground/
├── backend/
│   ├── src/
│   │   ├── app.ts                  # Express app setup
│   │   ├── index.ts                # Entry point
│   │   ├── lib/                    # AppError, cookies, prisma singleton
│   │   ├── middlewares/
│   │   │   └── authGuard.ts        # JWT validation
│   │   ├── routes/
│   │   │   ├── architecture.ts     # CRUD + public sharing
│   │   │   ├── auth.ts             # Register/login/refresh/logout
│   │   │   ├── cost.ts             # POST /cost-estimate
│   │   │   ├── health.ts           # GET /health
│   │   │   └── simulate.ts         # POST /simulate
│   │   ├── services/
│   │   │   ├── architecture.ts     # CRUD with ownership checks
│   │   │   ├── auth.ts             # JWT + bcrypt logic
│   │   │   ├── cost.ts             # AWS pricing model
│   │   │   └── simulation/
│   │   │       ├── index.ts        # Engine: M/M/c, branching, failures
│   │   │       ├── graph.ts        # Adjacency list + topological sort
│   │   │       ├── types.ts        # All simulation types
│   │   │       └── nodes/          # Per-type capacity calculators
│   │   └── tests/                  # 32 tests (Jest + Supertest)
│   └── prisma/
│       └── schema.prisma           # User, RefreshToken, Architecture
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── nodes/              # Custom React Flow node
│   │   │   ├── editor/             # Sidebar, ConfigPanel, EdgePanel,
│   │   │   │                       # FailurePanel, SaveDialog, Toolbar
│   │   │   ├── dashboard/          # SummaryCards, LatencyChart,
│   │   │   │                       # UtilizationBars, NodeDetailTable,
│   │   │   │                       # CostBreakdown
│   │   │   └── scale/              # ScaleAnalysis (full-screen modal)
│   │   ├── pages/
│   │   │   ├── EditorPage.tsx      # Main canvas + all panels
│   │   │   ├── MyArchitecturesPage.tsx
│   │   │   └── SharedArchitecturePage.tsx
│   │   ├── hooks/                  # useAuth, useConnectionValidator,
│   │   │                           # useGraphStorage
│   │   └── services/
│   │       └── api.ts              # Axios + interceptors
│   └── vite.config.ts              # Proxy /api → localhost:3333
├── docker-compose.yml              # PostgreSQL 16
└── CLAUDE.md                       # Full project context
```

---

## Tech Decisions

**M/M/c over static capacity math** — queuing theory captures non-linear latency behavior near saturation. A node at 90% utilization has dramatically higher queue wait than one at 50%, and M/M/c models this accurately.

**Topological sort with per-node demand maps** — the engine computes inbound demand and output flow per node in topological order, supporting DAG architectures (branching traffic) instead of only linear pipelines.

**Edge weight normalization** — traffic split between branches uses relative weights, not absolute percentages. Users can input any scale (50/50, 7/3, 700/300) and the engine normalizes them to ratios among siblings.

**Multiplicative error composition** — when a bottleneck caps throughput and a partial_failure drops requests, survival rates multiply: `surviveRatio = bottleneckRatio × partialSurvive`. This correctly models independent failure sources.

**JWT in memory + refresh in httpOnly cookie** — access token never touches localStorage (prevents XSS theft). Refresh token is httpOnly (invisible to JS). Rotation on each refresh limits damage from leaked tokens.

**React Flow with a single node type** — all 7 component types (Client, LB, API, Queue, Worker, DB, Cache) share one `ArchitectureNode` component, switching rendering by `data.nodeType`. This keeps the node type registry simple.

**Cost per 1M requests as scale metric** — infrastructure cost is fixed regardless of traffic, so raw cost doesn't change. Plotting `cost / throughput × 1M` reveals efficiency: it drops as throughput grows, then spikes when the system saturates and throughput plateaus.

---

## Setup

### 1. Clone the repository
```bash
git clone https://github.com/IELSK/system-design-playground.git
cd system-design-playground
```

### 2. Start PostgreSQL
```bash
docker compose up -d
```

### 3. Configure environment

Create `backend/.env`:
```env
DATABASE_URL="postgresql://sdp:sdp@localhost:5432/sdp"
JWT_SECRET="your-secret-here"
JWT_REFRESH_SECRET="another-secret-here"
PORT=3333
CORS_ORIGIN="http://localhost:5173"
```

### 4. Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev          # http://localhost:3333
```

### 5. Frontend
```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

---

## Running Tests

```bash
cd backend
npm test             # 32 tests (needs PostgreSQL running)
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/simulate` | No | Run simulation on an architecture graph |
| POST | `/cost-estimate` | No | Estimate monthly AWS cost |
| POST | `/architectures` | Yes | Save architecture to cloud |
| GET | `/architectures` | Yes | List user's saved architectures |
| GET | `/architectures/:id` | Yes | Get a specific architecture |
| PATCH | `/architectures/:id` | Yes | Update architecture |
| DELETE | `/architectures/:id` | Yes | Delete architecture |
| GET | `/architectures/public/:id` | No | View a shared architecture |
| POST | `/auth/register` | No | Create account |
| POST | `/auth/login` | No | Login |
| POST | `/auth/refresh` | No | Rotate refresh token |
| POST | `/auth/logout` | No | Logout |
| GET | `/auth/me` | Yes | Current user info |

---

## Example Workflow

1. **Build** — Drag a Client, Load Balancer, API Server, Cache, and Database onto the canvas. Connect them.
2. **Configure** — Click each node to set parameters (instances, RPS limits, hit rates, etc.).
3. **Branch** — Add a Queue → Worker path alongside the Cache path. Click edges to set traffic split (e.g. 70% reads / 30% writes).
4. **Simulate** — Click "Simulate" to see bottlenecks, latency breakdown, and utilization per node.
5. **Break things** — Open the Failures panel, set a node to "node_down" or "capacity_degraded", re-simulate.
6. **Scale** — Click "Scale" to explore how the system behaves from 100 to 20,000 rps.
7. **Save & Share** — Cloud save your architecture, toggle it public, and share the link.

---

## Screenshots

> Mounted Canva
> <img width="1915" height="954" alt="image" src="https://github.com/user-attachments/assets/fea1abf5-8b53-41d9-9622-9fe5ba220307" />

> Performance Dashboard
> <img width="1915" height="955" alt="image" src="https://github.com/user-attachments/assets/24038d40-1b53-4039-9624-cb84fc9765aa" />

> Failure Applied
> <img width="1912" height="957" alt="image" src="https://github.com/user-attachments/assets/f4f7b0b8-ecb7-4fff-82a5-8c3c4a0ed42f" />

> Scale Analysis
> <img width="1911" height="952" alt="image" src="https://github.com/user-attachments/assets/96cfd2f7-4466-42e9-b2fa-bfcee8a6cfb8" />

> My Architectures
> <img width="1919" height="924" alt="image" src="https://github.com/user-attachments/assets/3edee0e7-8f75-486c-a624-9304824034c3" />

---

## Demo
> ## Demo
> [![Demo](https://img.youtube.com/vi/f7O8XenlnGU/0.jpg)](https://www.youtube.com/watch?v=f7O8XenlnGU)

---

## License

MIT
