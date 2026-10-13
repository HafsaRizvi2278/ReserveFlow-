# ReserveFlow

A resource reservation application for shared meeting rooms, workspaces, and equipment. Employees discover availability and manage their bookings; admins maintain resources and review organization-wide reservations.

## Stack

- Next.js App Router and TypeScript
- React 19 and Tailwind CSS v4
- PostgreSQL (`pg` driver, parameterized SQL)
- Server-managed opaque sessions, HTTP-only cookies, scrypt password hashing

The original teal/Inter frontend is preserved. The running application uses PostgreSQL; it does not use localStorage for users, resources, sessions, or reservations.

## Requirements

- Node.js 22.13+ (or Node.js 24 LTS) and npm
- PostgreSQL 17+ with permission to enable `btree_gist`, or Docker Desktop
- Git

## Local setup — Windows PowerShell

```powershell
npm ci
Copy-Item .env.example .env
# If using Docker Desktop:
docker compose up -d db
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://localhost:3000. If using your existing PostgreSQL installation, create an empty `reserveflow` database and change `DATABASE_URL` in `.env` to your actual database username/password. Percent-encode special characters in the URL password. Do not commit `.env`.

Example: `postgresql://postgres:YOUR_PASSWORD@localhost:5432/reserveflow`

`APP_ORIGIN` must match the browser URL exactly, including the port. This is used to validate the origin of mutations.

If port 3000 is occupied:

```powershell
# Also change APP_ORIGIN in .env to http://localhost:3001
npm run dev -- --port 3001
```

## Assessment Login Credentials

| Role | Name | Email | Password |
| --- | --- | --- | --- |
| Admin | Hafsa Rizvi | `admin@reserveflow.com` | `admin123` |
| Employee | Maya Perera | `mayaperere@examp.com` | `password` |
| Employee | Ayesha Fernando | `ayesha@examp.com` | `password` |
| Employee | Dilan Jayasinghe | `dilan@examp.com` | `password` |

Enter credentials manually. These passwords are intentionally simple for local assessment testing and must not be used in production. Run `npm run db:seed` to create or update these predefined accounts using the **latest local** `scripts/seed.mjs`.

The form submits email and password to the server login API. PostgreSQL stores user records and salted password hashes. Successful password verification creates an HTTP-only session cookie. Sessions persist across refreshes until expiry or logout. Server-side authorization restricts Admin resource management and organization-wide reservation access; Employees can modify only their own future confirmed bookings. Invalid credentials return an error, and sign-in rate limiting remains enabled.

## Commands

```powershell
npm run typecheck
npm test
npm run test:db
npm run build
npm run start
```

`npm test` covers server validation, ownership rules and password verification. `npm run test:db` requires a configured PostgreSQL database and permission to create an isolated temporary schema. It verifies concurrent overlap rejection, adjacency and cancellation release without changing application records.

## Booking rules

- New and edited reservations must start in the future.
- End must be after start; both belong to the same Sri Lanka date.
- Only active resources accept new or edited bookings.
- Employees may edit/cancel only their own future confirmed bookings.
- Admins may cancel any future confirmed booking.
- Cancelled bookings are retained and do not occupy a slot.
- Resource deactivation preserves existing bookings.
- Stored timestamps are `timestamptz`; display and inputs use Asia/Colombo.
- Conflicts use half-open ranges `[start,end)`, permitting adjacent bookings.

## Reliability and security decisions

Every mutation verifies the server session and role/ownership. Booking operations lock the resource row to coordinate with deactivation. A PostgreSQL GiST exclusion constraint rejects concurrent confirmed overlaps. User input is validated on the server; SQL values are parameterized.

Session cookies hold a random token; only its SHA-256 hash is stored in PostgreSQL. Sessions expire after eight hours and are revoked on logout. Passwords use salted scrypt hashes. Sign-in attempts are limited per email over a 15-minute window. Browser mutation origins are checked against `APP_ORIGIN`.

Employees receive their own full reservation data and sanitized future occupied intervals for other employees. Other employees' titles, notes and identities are not sent to their browser. Admin endpoints verify roles independently of the UI.

For HTTPS deployment set `COOKIE_SECURE=true`, update `APP_ORIGIN`, use private credentials and configure database TLS according to your provider. Public hosting is not required for the assessment.

## Structure

- `src/app/`: App Router pages/layouts and API route handler
- `src/screens/`: existing screen components
- `src/components/`: shared UI and forms
- `src/services/apiService.ts`: browser API client
- `src/server/`: sessions, SQL access, validation and endpoint behavior
- `src/lib/`: date helpers and thin Next.js navigation adapters
- `database/001_initial.sql`: schema and constraints
- `scripts/`: migration and non-destructive seeding
- `tests/`: unit and PostgreSQL integration checks
- `docs/ER.md`: entity relationships (Mermaid diagram)
- `docs/er-diagram.svg`: shareable visual ER diagram
- `docs/DEMO.md`: suggested 3–5 minute demonstration
- `docs/VALIDATION.md`: verification evidence and remaining checks

## Assessment submission

Push the complete source to your GitHub repository, provide a shareable ER diagram link (`docs/er-diagram.svg`), and record a 3–5 minute demo. Complete the official submission form by 15 October 2026, 11:59 PM Sri Lanka time. Do not submit until local setup, database checks, and browser flows pass.
