# TaskMaster Pro

A full-stack student / assignment / writer management system.

- **Backend**: Node.js + Express + Sequelize (SQLite locally, Postgres optional).
- **Frontend**: Vite + React + TypeScript (HashRouter, PWA-capable).

## Quick start (local dev)

Two terminals.

```bash
# terminal 1 — backend (defaults to port 3000)
cd backend
npm install
npm start
```

```bash
# terminal 2 — frontend (defaults to http://localhost:5173)
cd frontend
npm install
npm run dev
```

The frontend talks to `/api/*`, which is served by the backend in dev and by the `vercel.json` rewrite in production.

## Environment variables

Backend (`backend/server.js` reads these via `dotenv`):

| Var | Required | Purpose |
| --- | --- | --- |
| `ADMIN_PASSWORD` | yes (for admin login) | Single password for the admin role. If unset, `POST /api/admin/login` returns **503** and admin login is disabled. |
| `JWT_SECRET` | recommended | Signs admin and writer JWTs. Falls back to a hardcoded dev secret if unset — do not rely on this in production. |
| `DB_PATH` | optional | SQLite file path. Defaults to `backend/database.sqlite`. |
| `DATABASE_URL` / `POSTGRES_URL` | optional | If set, Sequelize uses Postgres (SSL required) instead of SQLite. |
| `PORT` | optional | Backend listen port. Defaults to `3000`. |

Frontend (built into the static bundle, read at runtime in the browser):

| Var | Required | Purpose |
| --- | --- | --- |
| `API_KEY` | yes (for AI assistant) | Google Gemini API key, consumed by `frontend/services/geminiService.ts`. Without it the AI assistant returns an error message. |

## Database

- **Local dev**: SQLite at `backend/database.sqlite` (or `DB_PATH`). Schema is auto-created via `sequelize.sync()` on boot. A one-shot migration backfills `University` rows from existing students on first run.
- **Postgres**: set `DATABASE_URL` or `POSTGRES_URL`; Sequelize connects with `ssl: { require: true, rejectUnauthorized: false }`.
- **Vercel caveat**: the Vercel filesystem is read-only except `/tmp`. When SQLite is used on Vercel, `backend/models.js` copies the shipped DB to `/tmp/database.sqlite` and points Sequelize there. **This data is ephemeral** — it is lost on cold starts and across deploys. For any persistent deployment on Vercel, configure `DATABASE_URL` / `POSTGRES_URL` to a hosted Postgres.

## Vercel deploy

`vercel.json` declares two services in a single project:

```json
"rewrites": [
  { "source": "/api(/.*)?", "destination": { "type": "service", "service": "backend" } },
  { "source": "/(.*)",    "destination": { "type": "service", "service": "frontend" } }
]
```

So `/api/*` is routed to the Express backend and everything else is routed to the Vite frontend (HashRouter, so deep links work without server-side rewrites).

Set in the Vercel project settings (all three are required for a usable deploy):

- `ADMIN_PASSWORD`
- `JWT_SECRET`
- `API_KEY`

Optional: `DATABASE_URL` (recommended) or `POSTGRES_URL` to avoid the `/tmp` SQLite caveat.

## Authentication

Two independent flows, both returning JWTs.

- **Admin** — `POST /api/admin/login` with `{ "password": "..." }`. Returns a JWT with `role: "admin"` and a 24h expiry. There is **no default admin password**; you must set `ADMIN_PASSWORD` yourself.
- **Writer** — `POST /api/writer-auth/login` with `{ "phone": "<10 digits>" }`. Returns a JWT with `role: "writer"` and a 30d expiry. The phone must already be registered by an admin via the writers API — there is no self-signup and no OTP step.

All other `/api/*` routes require a valid JWT, and most are also gated to `role: "admin"`.

## Project structure

```
.
├── backend/
│   ├── server.js              # Express entry, admin login, CRUD endpoints
│   ├── models.js              # Sequelize models + DB init (SQLite/Postgres, Vercel /tmp)
│   ├── routes/
│   │   ├── writerAuth.js      # POST /api/writer-auth/login (phone-based)
│   │   └── writerDashboard.js # GET /api/writer-dashboard/* (JWT-protected)
│   └── package.json
├── frontend/
│   ├── index.tsx              # React entry
│   ├── App.tsx                # HashRouter + routes
│   ├── components/            # AdminLogin, WriterLogin, WriterDashboard, views, etc.
│   ├── services/              # dataService, alertService, geminiService
│   ├── vite.config.ts
│   └── package.json
├── vercel.json                # Multi-service routing (/api → backend, else → frontend)
├── Dockerfile                 # Multi-stage build (frontend → backend + dist/)
└── docker-compose.yml         # Runs the Docker image, mounts ./data for SQLite
```

## Useful scripts

| Command | Where | Effect |
| --- | --- | --- |
| `npm start` | `backend/` | `node server.js` — boots Express + syncs the DB. |
| `npm run dev` | `backend/` | `nodemon server.js` — same, with auto-restart. |
| `npm run dev` | `frontend/` | Vite dev server with HMR. |
| `npm run build` | `frontend/` | Vite production build into `frontend/dist/`. |
| `npm run preview` | `frontend/` | Serve the built `dist/` locally. |

## Known caveats

- **No default credentials.** Admin login is 503 until `ADMIN_PASSWORD` is set; writer login fails until an admin has registered the writer's phone.
- **`WriterAchievement` model is unused.** It is defined and associated, but no code path ever creates rows or awards achievements.
- **Vercel SQLite is ephemeral.** See the Database section — use Postgres for any real deployment.
- **`JWT_SECRET` falls back to a hardcoded dev string** if unset. Always set it in production.
- **Mass-assignment protection** is a per-resource allowlist in `server.js` (`STUDENT_FIELDS`, `WRITER_FIELDS`, `ASSIGNMENT_FIELDS`); anything else is silently dropped.
