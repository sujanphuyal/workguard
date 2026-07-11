-- 003_employers.sql
CREATE TABLE employers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  position TEXT,
  colour TEXT NOT NULL DEFAULT '#6750A4',
  hourly_rate NUMERIC(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX employers_user_id_idx ON employers(user_id);
