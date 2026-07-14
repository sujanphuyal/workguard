-- Add optional per-shift reminder offset (minutes before start; 0 = at event time)
ALTER TABLE work_shifts
  ADD COLUMN IF NOT EXISTS reminder_minutes INTEGER NULL;
