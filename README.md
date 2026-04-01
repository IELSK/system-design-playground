# System Design Playground

A visual tool for modeling and simulating distributed system architectures using queuing theory (M/M/c), bottleneck detection, and scale projection.

## Stack

- **Backend:** Node.js · Express · TypeScript · Prisma · PostgreSQL
- **Frontend:** React · Vite · TypeScript · React Flow · Tailwind CSS · Recharts

## Quick Start

### 1. PostgreSQL via Docker

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Server starts at `http://localhost:3333`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

### 4. Run tests

```bash
cd backend
npm test
```

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and adjust as needed.
