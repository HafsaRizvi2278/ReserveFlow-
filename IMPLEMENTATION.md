# ReserveFlow migration

The exported React frontend has been migrated to Next.js App Router. Existing screens live in `src/screens` and retain shared styling and components. A thin `src/lib/navigation.tsx` adapter wraps Next.js navigation to reduce unnecessary component rewrites; React Router is removed.

The browser API client replaces the former mock service. PostgreSQL stores accounts, resources, bookings, sessions and login throttles. Server layouts protect pages; route handlers independently enforce mutation permissions and sanitize employee occupancy data.

`database/001_initial.sql` contains foreign keys, validation checks and a confirmed-reservation exclusion constraint. Resource row locking coordinates booking saves with deactivation. See README for local setup and docs/VALIDATION.md for checks actually performed.
