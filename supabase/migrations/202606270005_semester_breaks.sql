-- 005_semester_breaks.sql
CREATE TABLE semester_breaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT semester_breaks_valid_range CHECK (end_date >= start_date)
);

CREATE INDEX semester_breaks_user_dates_idx ON semester_breaks(user_id, start_date, end_date);
