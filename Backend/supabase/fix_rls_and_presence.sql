-- ══════════════════════════════════════════════════════════════════════════════
-- UniLift Fix: Driver Presence + Ride Visibility
-- Run this in Supabase → SQL Editor
--
-- Fixes:
--   1. Drivers can't see SEARCHING rides (RLS was blocking reads because
--      driver_id is NULL on searching rides — the old policy only allowed
--      "driver OR rider" which fails when neither column matches)
--   2. Online driver presence not visible / persisting offline drivers
--      (old "Users can read own profile" policy blocked cross-user reads)
-- ══════════════════════════════════════════════════════════════════════════════


-- ─── 1. Fix rides RLS ─────────────────────────────────────────────────────────
-- Drop ALL existing ride SELECT policies to avoid conflicts
DROP POLICY IF EXISTS "Ride participants can view"        ON public.rides;
DROP POLICY IF EXISTS "Drivers can view searching rides"  ON public.rides;

-- New unified policy: authenticated drivers can see SEARCHING rides;
-- rider and assigned driver can always see their own rides.
CREATE POLICY "Rides are visible to participants and searching drivers"
  ON public.rides FOR SELECT
  USING (
    auth.uid() = rider_id                 -- rider can always see own ride
    OR auth.uid() = driver_id             -- assigned driver can see accepted/in-transit ride
    OR (status = 'SEARCHING' AND auth.role() = 'authenticated')  -- any authed user can see searching rides (drivers need this)
  );

-- Make sure drivers can UPDATE ride rows (accept, start, complete)
DROP POLICY IF EXISTS "Participants can update rides" ON public.rides;
CREATE POLICY "Participants can update rides"
  ON public.rides FOR UPDATE
  USING (
    auth.uid() = driver_id
    OR auth.uid() = rider_id
    OR (status = 'SEARCHING' AND auth.role() = 'authenticated')  -- driver accepting (driver_id still null at time of check)
  );


-- ─── 2. Fix users RLS — driver presence ───────────────────────────────────────
-- Drop the old restrictive policy + any previous presence policy
DROP POLICY IF EXISTS "Users can read own profile"              ON public.users;
DROP POLICY IF EXISTS "Anyone can view online driver presence"  ON public.users;

-- New unified read policy:
--   • Own profile always readable
--   • Non-OFFLINE drivers visible to all authenticated users (for presence list + map)
CREATE POLICY "Users can read own profile or online drivers"
  ON public.users FOR SELECT
  USING (
    auth.uid() = id                        -- own profile
    OR driver_status != 'OFFLINE'          -- online/taking-orders visible to all authed users
  );


-- ─── 3. Ensure required columns exist (safe to re-run) ────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS driver_status TEXT
    NOT NULL DEFAULT 'OFFLINE'
    CHECK (driver_status IN ('TAKING_ORDERS', 'ONLINE', 'OFFLINE'));

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS vehicle       TEXT;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS vehicle_type  TEXT;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS rating        NUMERIC(3,2) DEFAULT 0;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_url    TEXT;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'ACTIVE'
    CHECK (account_status IN ('ACTIVE','SUSPENDED','PENDING','REJECTED'));

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS suspend_reason TEXT;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS suspended_at  TIMESTAMPTZ;

ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS ride_type TEXT DEFAULT 'HABAL'
    CHECK (ride_type IN ('HABAL', 'CAR', 'SHUTTLE', 'PREMIUM'));

ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS distance_km   NUMERIC(6,2);

ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS rider_name    TEXT;

ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS pickup_lat    NUMERIC(10,7);

ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS pickup_lng    NUMERIC(10,7);

ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS dropoff_lat   NUMERIC(10,7);

ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS dropoff_lng   NUMERIC(10,7);

ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS driver_lat    NUMERIC(10,7);

ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS driver_lng    NUMERIC(10,7);

ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS driver_last_seen TIMESTAMPTZ;

ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS rider_rating  NUMERIC(3,2);

-- Update rides status CHECK to include ACCEPTED and IN_TRANSIT
-- (original schema only had SEARCHING, SCHEDULED, IN_TRANSIT, COMPLETED, CANCELLED)
-- ACCEPTED was missing from the original constraint
ALTER TABLE public.rides DROP CONSTRAINT IF EXISTS rides_status_check;
ALTER TABLE public.rides
  ADD CONSTRAINT rides_status_check
    CHECK (status IN ('SEARCHING','SCHEDULED','ACCEPTED','IN_TRANSIT','COMPLETED','CANCELLED'));


-- ─── 4. Enable Realtime (ignores error if already enabled) ──────────────────
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;
