-- ══════════════════════════════════════════════════════════════════════════════
-- UniLift Migration: Driver Presence System + Live Ride Request Board
-- Run this in Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── 1. Add driver_status to users ───────────────────────────────────────────
-- Tracks the driver's current availability:
--   TAKING_ORDERS  → green  · visible on map · receives ride requests
--   ONLINE         → yellow · visible on map · NOT accepting new requests
--   OFFLINE        → gray   · hidden from map and request feed
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS driver_status TEXT
    NOT NULL DEFAULT 'OFFLINE'
    CHECK (driver_status IN ('TAKING_ORDERS', 'ONLINE', 'OFFLINE'));

-- ─── 2. Add ride_type to rides ────────────────────────────────────────────────
ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS ride_type TEXT DEFAULT 'HABAL'
    CHECK (ride_type IN ('HABAL', 'CAR', 'SHUTTLE', 'PREMIUM'));

-- ─── 3. Add distance_km to rides ─────────────────────────────────────────────
ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS distance_km NUMERIC(6,2);

-- ─── 4. RLS: Drivers must see ALL searching rides (not just their own) ────────
-- Drop the existing restrictive policy first to avoid conflicts
DROP POLICY IF EXISTS "Drivers can view searching rides" ON public.rides;
CREATE POLICY "Drivers can view searching rides"
  ON public.rides FOR SELECT
  USING (
    status = 'SEARCHING'
    OR auth.uid() = driver_id
    OR auth.uid() = rider_id
  );

-- ─── 5. RLS: Online driver presence visible to all authenticated users ────────
-- Needed so the rider's map can render real driver markers
DROP POLICY IF EXISTS "Anyone can view online driver presence" ON public.users;
CREATE POLICY "Anyone can view online driver presence"
  ON public.users FOR SELECT
  USING (
    auth.uid() = id                   -- own profile always readable
    OR driver_status != 'OFFLINE'     -- online/taking-orders drivers visible to all
  );

-- ─── 6. Enable Realtime on rides and users ───────────────────────────────────
-- This makes Supabase broadcast row-level changes over the websocket channel.
-- (If already enabled via the Dashboard, these are safe no-ops.)
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
