# Medrella

Medrella is a lightweight outpatient appointment booking application built with Next.js. Patients can find doctors and book open slots, doctors can manage availability and appointments, and admins can manage doctor accounts, slots, and bookings.

## Features

- **Patients:** browse doctors, filter by specialty, book an available slot, cancel future appointments, and update contact details.
- **Doctors:** view upcoming appointments and patient contact details, mark visits completed, add availability, and remove open slots.
- **Admins:** view clinic stats, create doctor accounts, activate/deactivate doctors, generate slots in bulk, and manage all appointments.
- **Booking safety:** one database transaction with `SELECT ... FOR UPDATE` plus a partial unique index prevents double booking.
- **Roles:** patient, doctor, and admin with server-side authorization checks.

## Tech stack

- Next.js 16 App Router + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui-style components
- Better Auth (email/password + admin plugin)
- PostgreSQL + Drizzle ORM
- Zod validation
- date-fns / date-fns-tz

## Local setup

Requirements: Node.js 20.9+, npm, and Docker.

```bash
docker compose up -d
cp .env.example .env.local
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> If port `5432` is already in use, change the port in `compose.yaml` and `DATABASE_URL`.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Long random secret used by Better Auth |
| `BETTER_AUTH_URL` | Application base URL (`http://localhost:3000` locally) |
| `CLINIC_TIMEZONE` | IANA timezone used to display and generate slots |
| `SEED_*_EMAIL` / `SEED_*_PASSWORD` | Demo account credentials for the seed script |

## Demo accounts

Seeded accounts:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@medrella.test` | `Admin123!` |
| Doctor | `doctor@medrella.test` | `Doctor123!` |
| Patient | `patient@medrella.test` | `Patient123!` |

Additional seeded doctor accounts use `Doctor123!`:

- `vikram.sen@medrella.test`
- `meera.iyer@medrella.test`
- `arjun.patel@medrella.test`

New patient accounts can be created at `/register`.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript checks |
| `npm run db:up` / `npm run db:down` | Start/stop local PostgreSQL |
| `npm run db:generate` | Generate a Drizzle migration |
| `npm run db:migrate` | Apply migrations |
| `npm run db:bootstrap` | Create or promote the first production admin account |
| `npm run db:seed` | Seed demo accounts, doctors, slots, and one appointment |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run vercel-build` | Apply production migrations, then build for Vercel |

## Data model

- `user`, `session`, `account`, `verification` — Better Auth tables. The user record is also the patient profile (`phone` is stored on the user).
- `doctors` — clinic doctor records, optionally linked to a Better Auth user account.
- `doctor_slots` — future appointment slots with `open`, `held`, or `booked` status.
- `appointments` — patient bookings linked to a doctor and slot.

Key constraints:

- Unique index on `doctor_slots(doctor_id, start_at)`.
- Partial unique index on `appointments(slot_id)` where `status = 'booked'`.
- Indexes on `appointments(patient_id)` and `appointments(doctor_id)`.
- `doctor_slots.end_at > doctor_slots.start_at`.

## Booking flow

1. Patient opens a doctor page and selects an open future slot.
2. The server action authenticates the patient and starts a transaction.
3. The slot row is locked with `SELECT ... FOR UPDATE`.
4. The action verifies the slot is open, in the future, and the doctor is active.
5. The slot becomes `booked` and the appointment is inserted.
6. Cancelling a future appointment marks it `cancelled` and returns the slot to `open`.

## Deploying to Vercel

The project is configured for Vercel with a Neon PostgreSQL database.

### 1. Create the project and database

1. Push the repository to GitHub.
2. Import the repository in Vercel.
3. In the Vercel Marketplace, add Neon and connect it to the project.
4. Confirm the integration added `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct). If not, add both manually in Project Settings → Environment Variables.

The app uses the pooled URL. Migrations use the direct URL to avoid running through the Neon pooler.

### 2. Set environment variables

| Variable | Production value |
| --- | --- |
| `DATABASE_URL` | Neon pooled connection string |
| `DATABASE_URL_UNPOOLED` | Neon direct connection string |
| `BETTER_AUTH_SECRET` | Random secret of at least 32 characters |
| `BETTER_AUTH_URL` | `https://your-production-domain` |
| `CLINIC_TIMEZONE` | IANA timezone, for example `Asia/Kolkata` |
| `DATABASE_POOL_MAX` | Optional, defaults to `5` |
| `BETTER_AUTH_TRUSTED_ORIGINS` | Optional comma-separated extra origins/custom domains |

Generate the auth secret with:

```bash
openssl rand -base64 32
```

Set `BETTER_AUTH_URL` to the final production URL before deploying. If you add or change a custom domain later, update it and redeploy. Vercel preview URLs are supported automatically through Better Auth's dynamic base URL configuration.

### 3. Deploy

`vercel.json` configures the build command as `npm run vercel-build`.

- Production deployments apply pending Drizzle migrations, then run `next build`.
- Preview deployments skip migrations so they cannot modify the production database.
- If a migration fails, the deployment fails before going live.

### 4. Create the first admin

Production starts empty: no demo users, doctors, slots, or appointments. After the first successful deployment, run the bootstrap script once from your machine against the production database:

```bash
DATABASE_URL_UNPOOLED="postgresql://...direct..." \
BETTER_AUTH_SECRET="your-production-secret" \
BETTER_AUTH_URL="https://your-production-domain" \
BOOTSTRAP_ADMIN_NAME="Clinic Admin" \
BOOTSTRAP_ADMIN_EMAIL="admin@your-domain" \
BOOTSTRAP_ADMIN_PASSWORD="choose-a-long-password" \
npm run db:bootstrap
```

The script is idempotent: if the email already exists, it promotes that account to `admin`. When `DATABASE_URL_UNPOOLED` is present, the bootstrap script uses it instead of the pooled URL.

Do not run `npm run db:seed` against production; it creates demo accounts and sample data.

### 5. Verify the deployment

1. Open `/api/health`; it should return `{"status":"ok","database":"ok"}`.
2. Log in with the bootstrap admin account.
3. Create doctor accounts and generate slots from the admin workspace.
4. Register a patient account at `/register` and complete a booking.

## Scope

Implemented: patient, doctor, and admin role flows; instant booking; cancellation; availability management; admin doctor/slot/appointment management.

Not implemented: payments, email or SMS notifications, appointment rescheduling, hold expiry, password reset, Google OAuth, and automated tests.
