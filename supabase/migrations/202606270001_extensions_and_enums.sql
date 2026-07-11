-- 001_extensions_and_enums.sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE shift_status AS ENUM ('scheduled', 'worked', 'cancelled', 'missed');

CREATE TYPE course_type AS ENUM (
  'bachelors',
  'masters_coursework',
  'masters_research',
  'phd'
);

CREATE TYPE theme_preference AS ENUM ('system', 'light', 'dark');
