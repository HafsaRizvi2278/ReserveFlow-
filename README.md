<div align="center">

# ◈ ReserveFlow

### Resource reservations, without the scheduling chaos.

**A full-stack resource reservation platform for shared workspaces, meeting rooms, and equipment.**

Employees discover resources and manage bookings. Administrators control resource availability and oversee reservations—all backed by PostgreSQL and server-enforced permissions.

<br />

![Next.js](https://img.shields.io/badge/Next.js-16-111827?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-0E7490?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

<br />

[**Explore Features**](#-key-features) · [**Architecture**](#-architecture--data-model) · [**Run Locally**](#-run-locally) · [**Testing**](#-verification--testing)

<sub>Built for the PrimeWave Lab Software Engineering Internship technical assessment · October 2026</sub>

</div>

---

## ✨ Project at a glance

| The challenge | The solution |
| :--- | :--- |
| Shared resources can be double-booked. | Database-backed conflict prevention protects booking integrity. |
| Different users need different permissions. | Employee and admin roles are enforced on the server. |
| Timezone mistakes cause scheduling errors. | Reservations are validated in the **Asia/Colombo** timezone and stored as UTC instants. |
| Resource changes should not erase history. | Inactive resources and cancelled reservations retain historical records. |

> **Engineering highlight:** Reservation overlaps are prevented at the PostgreSQL level, including competing requests—not just by disabling dates in the UI.

## 🚀 Key features

<table>
<tr>
<td width="50%" valign="top">

### 👤 Employee workspace

- Browse and search shared resources
- Check resource details and availability
- Create reservations with time validation
- Edit or cancel eligible future bookings
- View personal booking history

</td>
<td width="50%" valign="top">

### 🛡️ Admin control center

- Add and update shared resources
- Activate or deactivate resources
- Review organization-wide reservations
- Manage eligible employee reservations
- Preserve resource and booking history

</td>
</tr>
</table>

### Built-in reliability

- **Conflict-safe reservations** — overlapping bookings are rejected; adjacent bookings are allowed.
- **Time-aware validation** — rejects past, reversed, invalid, and cross-day bookings.
- **Role-based authorization** — employees cannot mutate other users' reservations or access admin-only operations.
- **Session security** — hashed passwords, server-managed sessions, HTTP-only cookies, and login attempt protection.
- **Clear status feedback** — inactive resources and cancelled reservations are visually distinguished.

## 🖥️ Interface preview

> **Screenshots:** Add real application screenshots here once captured. Avoid using mockups that do not reflect the working application.

| Employee experience | Admin experience |
| :---: | :---: |
| Browse resources, check availability, and manage bookings | Manage resources and organization-wide reservations |

<!-- Optional: After committing screenshots to docs/screenshots/, replace the table above with:
![Employee dashboard](docs/screenshots/employee-dashboard.png)
![Admin resources](docs/screenshots/admin-resources.png)
-->

## 🧩 Architecture & data model

```text
┌───────────────────────────────────────┐
│  Next.js + React + Tailwind CSS       │
│  Employee and Admin Interfaces        │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│  Next.js App Router / API Handlers    │
│  Authentication · Authorization       │
│  Input Validation · Booking Rules     │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│  PostgreSQL                           │
│  Users · Resources · Reservations     │
│  Sessions · Login Attempts            │
│  Database-level Booking Constraints   │
└───────────────────────────────────────┘
```

**Entity relationship diagram**

![ReserveFlow ER diagram](docs/er-diagram.svg)

[View the ER diagram](docs/er-diagram.svg) · [Database design notes](docs/ER.md)

### Reservation rules

| Scenario | Expected behavior |
| :--- | :--- |
| 09:00–10:00 followed by 09:30–10:30 | ❌ Conflict rejected |
| 09:00–10:00 followed by 10:00–11:00 | ✅ Adjacent booking allowed |
| Reservation starts in the past | ❌ Rejected |
| Reservation crosses Colombo calendar days | ❌ Rejected |
| Cancelled reservation's time slot | ✅ Can be booked again |
| Inactive resource | ❌ New bookings blocked |

## 🛠️ Technology stack

| Area | Technology |
| :--- | :--- |
| Frontend | Next.js 16 App Router, React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Server | Next.js route handlers, Node.js |
| Database | PostgreSQL, `pg`, parameterized SQL |
| Authentication | Server-managed sessions, HTTP-only cookies, scrypt password hashing |
| Testing | Node.js built-in test runner, TypeScript compiler |
| Tooling | npm, Git, GitHub, Docker Compose (optional) |

## ⚙️ Run locally

**Prerequisites:** Node.js 22.13+ (or Node.js 24 LTS), npm, PostgreSQL 17+ (or Docker Desktop), and Git.

**1. Clone and install**

```powershell
git clone https://github.com/HafsaRizvi2278/ReserveFlow-.git
cd ReserveFlow-
npm ci
```

**2. Configure environment variables**

Create `.env` in the project root. Replace the placeholder credentials with your local PostgreSQL credentials.

```dotenv
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/reserveflow
APP_ORIGIN=http://localhost:3000
```

Create an empty `reserveflow` database in your PostgreSQL installation. Alternatively, if you use the project's Docker Compose database service, start it with:

```powershell
docker compose up -d db
```

> Never commit `.env` or production credentials. If the PostgreSQL password contains URL-special characters, percent-encode them in `DATABASE_URL`.

**3. Migrate, seed, and launch**

```powershell
npm run db:migrate
npm run db:seed
npm run dev
```

Open **http://localhost:3000**.

### Assessment demo accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| Admin | `admin@reserveflow.com` | `admin123` |
| Employee | `mayaperere@examp.com` | `password` |
| Employee | `ayesha@examp.com` | `password` |
| Employee | `dilan@examp.com` | `password` |

<sub>Demo credentials are for local assessment only. Do not reuse these passwords in production.</sub>

## 🧪 Verification & testing

```powershell
npm run typecheck
npm test
npm run test:db
npm run build
```

| Check | Last verified result |
| :--- | :--- |
| TypeScript type check | ✅ Passed |
| Unit tests | ✅ 7 / 7 passed |
| PostgreSQL integration test | ✅ 1 / 1 passed |
| Production build | ✅ Passed |

Tests cover Colombo time conversion, invalid and cross-day bookings, reservation ownership and admin permissions, resource capacity, password verification, and database conflict protection.

## 📁 Repository structure

```text
ReserveFlow/
├── database/             # SQL schema and constraints
├── docs/                 # ER diagram and database notes
├── public/               # Static assets
├── scripts/              # Database migration and seed scripts
├── src/
│   ├── app/              # App Router pages and API handlers
│   ├── components/       # Reusable UI components
│   ├── screens/          # Feature screens
│   └── server/           # Server-side logic
├── tests/                # Validation and database tests
├── compose.yaml          # Optional PostgreSQL service
└── README.md
```

## 🔭 Potential next steps

Email confirmations, calendar integrations, resource usage analytics, automated reminders, and CI/CD are possible future improvements—not features claimed in this version.

---

<div align="center">

### Designed and developed by Hafsa Rizvi

**Frontend-Focused Full-Stack Developer**

[Portfolio](https://hafsa-rizvi.vercel.app/) · [GitHub](https://github.com/HafsaRizvi2278) · [Repository](https://github.com/HafsaRizvi2278/ReserveFlow-)

<sub>PrimeWave Lab (Pvt) Ltd · Software Engineering Internship Technical Assessment</sub>

</div>
