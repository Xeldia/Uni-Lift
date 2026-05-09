-- ══════════════════════════════════════════════════════════════════════════════
-- Fare Negotiation Migration
-- New flow: Rider posts ride (no fare) → Driver proposes fare → Rider accepts/declines
-- Run this entire file in Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. Expand the rides.status CHECK constraint to include FARE_PROPOSED and ACCEPTED
ALTER TABLE public.rides
  DROP CONSTRAINT IF EXISTS rides_status_check;

ALTER TABLE public.rides
  ADD CONSTRAINT rides_status_check
  CHECK (status IN (
    'SEARCHING',
    'SCHEDULED',
    'FARE_PROPOSED',
    'ACCEPTED',
    'IN_TRANSIT',
    'COMPLETED',
    'CANCELLED'
  ));

-- 2. Update RLS so any authenticated user can propose a fare on a SEARCHING ride
--    (driver_id is NULL while ride is SEARCHING — the driver is not yet assigned)
DROP POLICY IF EXISTS "Participants can update rides" ON public.rides;

CREATE POLICY "Participants can update rides"
  ON public.rides FOR UPDATE
  USING (
    auth.uid() = rider_id
    OR auth.uid() = driver_id
    OR (status = 'SEARCHING' AND driver_id IS NULL)
  );

-- 3. Add any missing columns that the fare-negotiation flow requires
ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS rider_rating      NUMERIC(2,1),
  ADD COLUMN IF NOT EXISTS rider_tags        TEXT[],
  ADD COLUMN IF NOT EXISTS driver_lat        NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS driver_lng        NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS driver_last_seen  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS accepted_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ride_type         TEXT,
  ADD COLUMN IF NOT EXISTS distance_km       NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS pickup_lat        NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS pickup_lng        NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS dropoff_lat       NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS dropoff_lng       NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS rider_name        TEXT;
