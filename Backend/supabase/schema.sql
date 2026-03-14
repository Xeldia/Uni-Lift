  -- ══════════════════════════════════════════════════════════════════════════════
  -- UniLift Database Schema
  -- Run this in Supabase → SQL Editor
  -- ══════════════════════════════════════════════════════════════════════════════


  -- ─── USERS TABLE ─────────────────────────────────────────────────────────────
  -- Mirrors auth.users. Populated automatically via trigger on sign-up.

  CREATE TABLE IF NOT EXISTS public.users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT UNIQUE NOT NULL,
    full_name     TEXT NOT NULL,
    student_id    TEXT UNIQUE NOT NULL,
    phone_number  TEXT,
    role          TEXT NOT NULL DEFAULT 'rider' CHECK (role IN ('rider', 'driver', 'both')),
    university    TEXT NOT NULL DEFAULT 'CIT-U',
    id_scan_url   TEXT,
    status        TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'PENDING')),
    is_verified   BOOLEAN DEFAULT FALSE,
    rating        NUMERIC(3,2) DEFAULT 0,
    rides_completed INTEGER DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
  );

  ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS profile_photo BYTEA,
    ADD COLUMN IF NOT EXISTS profile_photo_mime TEXT,
    ADD COLUMN IF NOT EXISTS profile_photo_name TEXT,
    ADD COLUMN IF NOT EXISTS profile_photo_updated_at TIMESTAMPTZ;

  -- ─── AUTO-CREATE USERS ROW ON AUTH SIGN-UP ───────────────────────────────────
  -- This trigger fires whenever a new record is inserted into auth.users,
  -- and automatically creates the matching row in public.users.

  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER SET search_path = public
  AS $$
  BEGIN
    INSERT INTO public.users (id, email, full_name, student_id, phone_number, university)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown'),
      COALESCE(NEW.raw_user_meta_data->>'student_id', 'N/A'),
      NEW.raw_user_meta_data->>'phone_number',
      COALESCE(NEW.raw_user_meta_data->>'university', 'CIT-U')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
  END;
  $$;

  -- Drop if exists then recreate
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  -- ─── RIDES TABLE ─────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS public.rides (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
    rider_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    pickup        TEXT NOT NULL,
    dropoff       TEXT NOT NULL,
    fare          NUMERIC(8,2),
    status        TEXT NOT NULL DEFAULT 'SEARCHING'
                    CHECK (status IN ('SEARCHING','SCHEDULED','IN_TRANSIT','COMPLETED','CANCELLED')),
    scheduled_at  TIMESTAMPTZ,
    started_at    TIMESTAMPTZ,
    completed_at  TIMESTAMPTZ,
    cancelled_at  TIMESTAMPTZ,
    cancel_reason TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
  );


  -- ─── VERIFICATIONS TABLE ─────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS public.verifications (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    id_image_url      TEXT,
    license_url       TEXT,
    vehicle_type      TEXT,
    plate_number      TEXT,
    status            TEXT NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN ('PENDING','APPROVED','REJECTED')),
    rejection_reason  TEXT,
    submitted_at      TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at       TIMESTAMPTZ
  );


  -- ─── SOS ALERTS TABLE ────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS public.sos_alerts (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    ride_id          UUID REFERENCES public.rides(id) ON DELETE SET NULL,
    type             TEXT NOT NULL CHECK (type IN ('ALARM','SILENT')),
    location         TEXT,
    lat              NUMERIC(10,7),
    lng              NUMERIC(10,7),
    status           TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','RESOLVED')),
    resolution_note  TEXT,
    resolved_by      TEXT,
    triggered_at     TIMESTAMPTZ DEFAULT NOW(),
    resolved_at      TIMESTAMPTZ
  );


  -- ─── MESSAGES TABLE ──────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS public.messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id     UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
    sender_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    sent_at     TIMESTAMPTZ DEFAULT NOW()
  );


  -- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────
  ALTER TABLE public.users         ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.rides         ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.sos_alerts    ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.messages      ENABLE ROW LEVEL SECURITY;

  -- Users: anyone authenticated can read, only owner can update own row
  CREATE POLICY "Users can read own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

  CREATE POLICY "Users can insert own profile"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = id);

  CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

  -- Rides: driver or rider can read their own rides
  CREATE POLICY "Ride participants can view"
    ON public.rides FOR SELECT
    USING (auth.uid() = driver_id OR auth.uid() = rider_id);

  CREATE POLICY "Riders can create rides"
    ON public.rides FOR INSERT
    WITH CHECK (auth.uid() = rider_id);

  CREATE POLICY "Participants can update rides"
    ON public.rides FOR UPDATE
    USING (auth.uid() = driver_id OR auth.uid() = rider_id);

  -- Verifications: user sees own verification
  CREATE POLICY "Users can view own verification"
    ON public.verifications FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "Users can submit verification"
    ON public.verifications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  -- SOS: user can create and view own alerts
  CREATE POLICY "Users can create SOS"
    ON public.sos_alerts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can view own SOS"
    ON public.sos_alerts FOR SELECT
    USING (auth.uid() = user_id);

  -- Messages: ride participants only
  CREATE POLICY "Ride participants can message"
    ON public.messages FOR ALL
    USING (
      auth.uid() IN (
        SELECT driver_id FROM public.rides WHERE id = ride_id
        UNION
        SELECT rider_id FROM public.rides WHERE id = ride_id
      )
    );


  -- ─── UPDATED_AT TRIGGER ───────────────────────────────────────────────────────
  CREATE OR REPLACE FUNCTION public.set_updated_at()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$;

  CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

  CREATE TRIGGER set_rides_updated_at
    BEFORE UPDATE ON public.rides
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
