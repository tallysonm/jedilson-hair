# Jedilson Hair — Barbershop Appointment App

Full-stack appointment scheduling app for "Gedilson Rai Barbershop" / "Jedilson Hair" with a premium dark UI.

## Run & Operate

- `pnpm run typecheck` — full typecheck (libs + leaf packages)
- `pnpm run typecheck:libs` — build composite libs only
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks/Zod from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `SESSION_SECRET`

## Stack

- **Frontend**: React 19 + Vite 7 + TailwindCSS v4 + shadcn/ui + Framer Motion + FullCalendar
- **Backend**: Express 5 + Pino logging
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod v4 + drizzle-zod
- **API codegen**: Orval (OpenAPI → React Query hooks + Zod schemas)
- **Fonts**: Playfair Display (display) + Inter (body)
- **Monorepo**: pnpm workspaces

## Where things live

- `lib/db/src/schema/` — DB tables (barbers, appointments)
- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod schemas; `index.ts` manually excludes conflicting exports
- `artifacts/barbershop/src/` — React frontend (BookingPage, AdminDashboardPage, AdminLoginPage)
- `artifacts/barbershop/src/components/Logo.tsx` — JedilsonLogo component
- `artifacts/barbershop/src/index.css` — design tokens, glass utilities, FullCalendar overrides
- `artifacts/api-server/src/routes/` — Express route handlers

## Architecture decisions

- **Contract-first API**: All backend/frontend changes start with `openapi.yaml`, then codegen
- **barberId nullable**: Appointments can have no barber; conflict-checking is per-barber when set
- **30-min slots only**: Both frontend and backend enforce 30-minute booking increments
- **3-month booking window**: Backend validates date is within 3 months; frontend enforces with `max` attribute
- **api-zod/index.ts is manual**: After codegen, check for new types that conflict with Zod schema names in `generated/api.ts` and exclude them from index.ts (known conflicts: createAppointmentBody, updateAppointmentBody, loginBody, createBarberBody, updateBarberBody)

## Product

- **Booking page** (`/`): 4-step wizard (service → barber → date/time → info+confirm), single + recurring weekly appointments, floating WhatsApp FAB, address/hours footer, JedilsonLogo header
- **Admin login** (`/admin`): Credential-based (admin / 1234), JedilsonLogo, ambient glow
- **Admin dashboard** (`/admin/dashboard`):
  - **Visão Geral**: KPI cards + 14-day revenue area chart + services bar chart
  - **Calendário**: FullCalendar week/day view with per-barber filter, color-coded events
  - **Agendamentos**: Table with period/barber filters, recurring badge, delete single/group
  - **Novo Agendamento**: Admin create form (single + recurring)
  - **Barbeiros**: Premium card grid with photo/avatar, specialty tag, WhatsApp link, Instagram, bio, birthday; full profile edit dialog

## Business Info

- **Name**: Gedilson Rai Barbershop / Jedilson Hair
- **Address**: R. Mademoiselle - Helena Maria, Osasco - SP, 06253-200
- **Phone / WhatsApp**: (11) 97343-6623
- **Hours**: Ter–Sáb 07:00–20:00 | Dom 07:00–14:00 | Seg: Fechado
- **Admin credentials**: admin / 1234

## Barber profile fields

`barbersTable`: id, name, photo (URL), phone, birthDate (YYYY-MM-DD), bio, specialty, instagram, active, createdAt

## User preferences

- Brazilian Portuguese UI throughout
- Deep black (#080808) background, accent red (#C1121F), gold (#C9A84C)
- Playfair Display for headings, Inter for body
- Glass-card design system (glass-card, glass, glass-strong CSS classes)
- Floating WhatsApp button on booking page

## Gotchas

- SelectItem cannot have empty string value — use "all" sentinel, convert to null before API calls
- `bg-gold` / `text-gold` / `border-gold` are custom CSS classes (not Tailwind)
- After codegen, always check `lib/api-zod/src/index.ts` for new naming conflicts
- Monday is closed — validate `getUTCDay() === 1` on date input

## Pointers

- Skills: `.local/skills/pnpm-workspace`, `.local/skills/react-vite`, `.local/skills/database`
- DB ref: `lib/db/src/schema/barbers.ts`, `lib/db/src/schema/appointments.ts`
- API spec: `lib/api-spec/openapi.yaml`
