-- 004_work_shifts.sql
CREATE TABLE work_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employer_id UUID NOT NULL REFERENCES employers(id) ON DELETE RESTRICT,
  status shift_status NOT NULL DEFAULT 'scheduled',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  notes TEXT,
  recurrence_group_id UUID,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT work_shifts_end_after_start CHECK (end_time > start_time)
);

CREATE INDEX work_shifts_user_start_idx ON work_shifts(user_id, start_time);
CREATE INDEX work_shifts_user_status_start_idx ON work_shifts(user_id, status, start_time);
CREATE INDEX work_shifts_recurrence_idx ON work_shifts(recurrence_group_id) WHERE recurrence_group_id IS NOT NULL;

CREATE TRIGGER work_shifts_updated_at
  BEFORE UPDATE ON work_shifts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
