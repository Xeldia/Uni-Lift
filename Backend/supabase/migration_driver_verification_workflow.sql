-- Driver verification workflow fields on users table
-- Safe to re-run.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS driver_verification_status TEXT NOT NULL DEFAULT 'NOT_SUBMITTED'
    CHECK (driver_verification_status IN ('NOT_SUBMITTED','PENDING','APPROVED','REJECTED','REVOKED')),
  ADD COLUMN IF NOT EXISTS driver_full_address TEXT,
  ADD COLUMN IF NOT EXISTS driver_college TEXT,
  ADD COLUMN IF NOT EXISTS driver_course TEXT,
  ADD COLUMN IF NOT EXISTS driver_plate_number TEXT,
  ADD COLUMN IF NOT EXISTS driver_license_number TEXT,
  ADD COLUMN IF NOT EXISTS driver_rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS driver_verified_at TIMESTAMPTZ;
