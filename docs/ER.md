# ReserveFlow entity relationships

erDiagram
 USERS ||--o{ SESSIONS : has
 USERS ||--o{ RESERVATIONS : creates
 RESOURCES ||--o{ RESERVATIONS : receives
 USERS {
  text id PK
  text name
  text email UK
  text role
  text password_hash
 }
 SESSIONS {
  text token_hash PK
  text user_id FK
  timestamptz expires_at
  timestamptz created_at
 }
 RESOURCES {
  text id PK
  text name
  text category
  text description
  text location
  integer capacity
  text_array amenities
  boolean is_active
  timestamptz created_at
  timestamptz updated_at
 }
 RESERVATIONS {
  text id PK
  text resource_id FK
  text user_id FK
  text title
  text notes
  timestamptz starts_at
  timestamptz ends_at
  text status
  timestamptz created_at
  timestamptz updated_at
 }
 LOGIN_ATTEMPTS {
  text email PK
  integer attempts
  timestamptz window_start
 }

