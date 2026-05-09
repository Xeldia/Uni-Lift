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
    role          TEXT NOT NULL DEFAULT 'rider' CHECK (role IN ('rider', 'driver', 'both', 'admin')),
    university    TEXT NOT NULL DEFAULT 'CIT-U',
    id_scan_url   TEXT,
    avatar_url    TEXT,
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
    pickup_lat    NUMERIC(10,7),
    pickup_lng    NUMERIC(10,7),
    dropoff_lat   NUMERIC(10,7),
    dropoff_lng   NUMERIC(10,7),
    driver_lat    NUMERIC(10,7),
    driver_lng    NUMERIC(10,7),
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

  -- Users: any authenticated user can read profiles (needed for search + conversation display)
  CREATE POLICY "Authenticated users can read profiles"
    ON public.users FOR SELECT
    USING (auth.uid() IS NOT NULL);

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


  -- ─── CONVERSATIONS TABLE ──────────────────────────────────────────────────────
  -- One conversation per rider↔driver pair. Status tracks negotiation lifecycle.
  CREATE TABLE IF NOT EXISTS public.conversations (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    driver_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status           TEXT NOT NULL DEFAULT 'REQUESTED'
                       CHECK (status IN ('REQUESTED','NEGOTIATING','AGREED','COMPLETED','CANCELLED')),
    pickup           TEXT,
    dropoff          TEXT,
    pickup_lat       NUMERIC,
    pickup_lng       NUMERIC,
    dropoff_lat      NUMERIC,
    dropoff_lng      NUMERIC,
    agreed_fare      NUMERIC,
    ride_id          UUID REFERENCES public.rides(id) ON DELETE SET NULL,
    last_message_at  TIMESTAMPTZ DEFAULT NOW(),
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(rider_id, driver_id)
  );

  ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Conversation participants can view"
    ON public.conversations FOR SELECT
    USING (auth.uid() = rider_id OR auth.uid() = driver_id);

  CREATE POLICY "Riders can create conversations"
    ON public.conversations FOR INSERT
    WITH CHECK (auth.uid() = rider_id);

  CREATE POLICY "Conversation participants can update"
    ON public.conversations FOR UPDATE
    USING (auth.uid() = rider_id OR auth.uid() = driver_id);


  -- ─── EXTEND MESSAGES TABLE ───────────────────────────────────────────────────
  -- Add conversation_id, message type, and offer negotiation columns.
  -- Make ride_id nullable — messages can belong to a conversation without a ride.
  ALTER TABLE public.messages
    ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS type            TEXT NOT NULL DEFAULT 'text'
                                               CHECK (type IN ('text','offer','system')),
    ADD COLUMN IF NOT EXISTS offer_amount    NUMERIC,
    ADD COLUMN IF NOT EXISTS offer_status    TEXT
                                               CHECK (offer_status IN ('PENDING','COUNTERED','ACCEPTED','DECLINED'));

  ALTER TABLE public.messages ALTER COLUMN ride_id DROP NOT NULL;

  -- Update RLS: conversation participants can read all messages; only sender can insert
  DROP POLICY IF EXISTS "Ride participants can message" ON public.messages;
  DROP POLICY IF EXISTS "Conversation participants can message" ON public.messages;

  -- SELECT: any participant can read all messages in their conversations
  CREATE POLICY "Conversation participants can read messages"
    ON public.messages FOR SELECT
    USING (
      conversation_id IN (
        SELECT id FROM public.conversations
        WHERE rider_id = auth.uid() OR driver_id = auth.uid()
      )
      OR ride_id IN (
        SELECT id FROM public.rides
        WHERE driver_id = auth.uid() OR rider_id = auth.uid()
      )
    );

  -- INSERT: only the sender can insert their own messages
  CREATE POLICY "Users can send messages"
    ON public.messages FOR INSERT
    WITH CHECK (
      auth.uid() = sender_id
      AND (
        conversation_id IN (
          SELECT id FROM public.conversations
          WHERE rider_id = auth.uid() OR driver_id = auth.uid()
        )
        OR ride_id IN (
          SELECT id FROM public.rides
          WHERE driver_id = auth.uid() OR rider_id = auth.uid()
        )
      )
    );

  -- UPDATE: participants can update messages (offer status changes)
  CREATE POLICY "Conversation participants can update messages"
    ON public.messages FOR UPDATE
    USING (
      conversation_id IN (
        SELECT id FROM public.conversations
        WHERE rider_id = auth.uid() OR driver_id = auth.uid()
      )
    );


  -- ─── EXTEND USERS TABLE — Driver verification document URLs ──────────────────
  ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS license_front_url  TEXT,
    ADD COLUMN IF NOT EXISTS license_back_url   TEXT,
    ADD COLUMN IF NOT EXISTS vehicle_reg_url    TEXT,
    ADD COLUMN IF NOT EXISTS docs_submitted_at  TIMESTAMPTZ;


  -- ─── NOTIFICATIONS TABLE ──────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS public.notifications (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title      TEXT NOT NULL,
    body       TEXT NOT NULL,
    metadata   JSONB DEFAULT '{}',
    read       BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Users can read own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "Authenticated users can create notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

  CREATE POLICY "Users can update own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);
