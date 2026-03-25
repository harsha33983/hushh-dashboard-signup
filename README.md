# Drop-off Intelligence Platform

A full-stack analytics platform for tracking user drop-offs, identifying friction points, and improving signup conversion rates.

## Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, TanStack Query
- **Backend**: FastAPI (Python), SQLModel, asyncpg
- **Database**: PostgreSQL via Supabase

## Project Structure

```
├── app/                        # Next.js frontend
│   ├── (dashboard)/            # Dashboard routes (layout with sidebar)
│   │   ├── dashboard/          # Overview page
│   │   ├── funnels/            # Funnel builder & visualization
│   │   ├── insights/           # AI-generated insights
│   │   ├── alerts/             # Error & anomaly alerts
│   │   ├── users/              # User sessions
│   │   └── settings/           # App settings
│   └── api/                    # Next.js API routes (proxy layer)
├── backend/                    # FastAPI backend
│   └── app/
│       ├── api/routes/         # Route handlers (events, funnels, insights, summary)
│       ├── core/               # Config, database connection
│       ├── models/             # SQLModel ORM models
│       ├── schemas/            # Pydantic request/response schemas
│       ├── services/           # Business logic
│       └── utils/              # Helpers
└── components/                 # Shared React components
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- A Supabase project (or any PostgreSQL database)

### 1. Install dependencies

```bash
# Frontend
npm install

# Backend
cd backend
pip install -r requirements.txt
```

### 2. Configure environment

Frontend — `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
POSTGRES_URL=your_postgres_connection_string
```

Backend — `backend/.env`:
```env
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/dbname
SECRET_KEY=your-secret-key
API_KEY=your-api-key
ENVIRONMENT=development
```

### 3. Run the app

In two separate terminals:

```bash
# Terminal 1 — Frontend (http://localhost:3000)
npm run dev

# Terminal 2 — Backend (http://localhost:8000)
cd backend
uvicorn app.main:app --reload --port 8000
```

API docs available at `http://localhost:8000/docs`.

## Features

- Funnel visualization with step-by-step drop-off rates
- Field-level friction scoring to pinpoint UX bottlenecks
- Real-time alerts for error spikes and anomalies
- Cohort breakdowns (device, network, geography)
- AI-generated insights and fix recommendations
- Session replay and user journey tracking
- Rate limiting, request tracing, and structured logging

## API Overview

All backend endpoints are prefixed with `/api/v1` and require an `X-Api-Key` header.

| Route | Description |
|---|---|
| `GET /api/v1/events` | Fetch tracked events |
| `GET /api/v1/funnels` | List funnels |
| `GET /api/v1/funnels/{id}/analytics` | Funnel step analytics |
| `GET /api/v1/insights` | AI insights |
| `GET /api/v1/summary` | Dashboard summary stats |
| `POST /api/track` | Ingest a new event |
