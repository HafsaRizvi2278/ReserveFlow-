CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TABLE IF NOT EXISTS users (
 id text PRIMARY KEY,
 name text NOT NULL,
 email text UNIQUE NOT NULL CHECK (email = lower(email)),
 role text NOT NULL CHECK (role IN ('admin','employee')),
 password_hash text NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash text PRIMARY KEY,
 user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS login_attempts (
 email text PRIMARY KEY,
 attempts integer NOT NULL DEFAULT 0,
 window_start timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS resources (
 id text PRIMARY KEY,
 name text NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 120),
 category text NOT NULL CHECK(category IN ('Meeting Room','Workspace','Equipment')),
 description text NOT NULL,
 location text NOT NULL,
 capacity integer NOT NULL CHECK(capacity > 0),
 amenities text[] NOT NULL DEFAULT '{}',
 is_active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS reservations (
 id text PRIMARY KEY,
 resource_id text NOT NULL REFERENCES resources(id),
 user_id text NOT NULL REFERENCES users(id),
 title text NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 160),
 notes text NOT NULL DEFAULT '',
 starts_at timestamptz NOT NULL,
 ends_at timestamptz NOT NULL,
 status text NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed','cancelled')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(starts_at < ends_at),
 CONSTRAINT no_confirmed_overlap EXCLUDE USING gist (
  resource_id WITH =,
  tstzrange(starts_at,ends_at,'[)') WITH &&
 ) WHERE (status = 'confirmed')
);
CREATE INDEX IF NOT EXISTS reservations_user_time ON reservations(user_id,starts_at);
CREATE INDEX IF NOT EXISTS reservations_start ON reservations(starts_at);
