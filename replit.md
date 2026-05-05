# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Full-stack appointment scheduling app for "Gedilson Rai Barbershop".

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + TailwindCSS v4 + shadcn/ui + Recharts

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Artifacts

### `artifacts/barbershop` — Gedilson Rai Barbershop (preview `/`)
React + Vite frontend. Three pages:
- `/` — Public booking page (client fills name, phone, picks service, barber (optional), date/time; supports single and recurring appointments)
- `/admin` — Admin login (admin / 1234)
- `/admin/dashboard` — Protected admin dashboard with tabs:
  - **Visão Geral** — KPI cards, revenue chart, services bar chart
  - **Calendário** — FullCalendar week/day view with per-barber filter
  - **Agendamentos** — Table with period + barber filters; shows Barbeiro column
  - **Novo Agendamento** — Create appointment with barber selector
  - **Barbeiros** — Manage barbers: add, rename, activate/deactivate

Design system: dark (#0A0A0A bg), red (#C1121F primary), gold (#D4AF37 accent), glassmorphism cards, Inter font.

### `artifacts/api-server` — API Server (preview `/api`)
Express backend serving all routes under `/api`:
- `GET /api/services` — static list of 15 services
- `GET /api/barbers` — list all barbers (seeds 3 defaults on startup: Jedilson, Barbeiro 2, Barbeiro 3)
- `POST /api/barbers` — create a barber
- `PATCH /api/barbers/:id` — update barber (name, photo, active)
- `GET/POST /api/appointments` — list/create appointments (supports `barberId` filter)
- `GET /api/appointments/available-slots` — available time slots (conflict-aware, per-barber if `barberId` given)
- `PATCH/DELETE /api/appointments/:id` — update/delete appointment
- `POST /api/appointments/recurring` — create recurring weekly appointments (supports `barberId`)
- `DELETE /api/appointments/group/:groupId` — delete entire recurrence group
- `POST /api/auth/login` — admin login (hardcoded: admin/1234)
- `GET /api/dashboard/summary` — KPI summary
- `GET /api/dashboard/revenue-chart` — 30-day revenue data
- `GET /api/dashboard/services-chart` — most sold services

## Database

PostgreSQL via `@workspace/db`. Tables:
- `appointments` — client bookings with service info, date/time, status (pending/completed/cancelled), optional `barberId`
- `barbers` — barber profiles (id, name, photo, active, createdAt)

## Business Info

- **Name**: Gedilson Rai Barbershop / Jedilson Hair
- **Address**: R. Mademoiselle - Helena Maria, Osasco - SP, 06253-200
- **Phone**: (11) 97343-6623
- **Hours**: Ter–Sáb 07:00–20:00 | Dom 07:00–14:00 | Seg: Fechado
- **Admin credentials**: admin / 1234

## Feature Notes

### Multi-barber support
- `barberId` is nullable on appointments — existing data without a barber is preserved
- Available-slots conflict checking is per-barber when `barberId` is provided
- Default barbers seeded on server start if table is empty
- Clients can optionally pick a barber or leave "Qualquer barbeiro"
- Admin can filter calendar and appointments list by barber

### 30-min slot enforcement + 3-month booking window
- All time slots are generated in 30-min increments
- Backend validates booking date is within 3 months from today (400 if exceeded)
- Frontend `max` attribute on date inputs enforces the same window

### Recurring appointments
- Admin and clients can create weekly recurring appointments for "this month" or "next 2 months"
- Conflicts are skipped (not rejected); result includes `created` and `skipped` arrays
- Group delete removes all appointments sharing a `recurrenceGroupId`

## Notes on api-zod index.ts

`lib/api-zod/src/index.ts` manually lists only non-conflicting types from `generated/types/` (excludes `createAppointmentBody`, `updateAppointmentBody`, `loginBody` which share names with Zod schemas in `generated/api.ts`). After running codegen, check if new generated types need to be added there.
