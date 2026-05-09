-- ══════════════════════════════════════════════════════════════════════════════
-- UniLift Chat Migration
-- Paste this entire file into Supabase → SQL Editor → Run
-- Safe to re-run (uses IF NOT EXISTS / DROP IF EXISTS throughout)
-- ══════════════════════════════════════════════════════════════════════════════


-- ─── 1. CONVERSATIONS TABLE ───────────────────────────────────────────────────
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

-- Fix status check if table already existed with old constraint
ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_status_check;
ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_status_check
  CHECK (status IN ('REQUESTED','NEGOTIATING','AGREED','COMPLETED','CANCELLED'));

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Conversation participants can view"    ON public.conversations;
DROP POLICY IF EXISTS "Riders can create conversations"       ON public.conversations;
DROP POLICY IF EXISTS "Conversation participants can update"  ON public.conversations;
DROP POLICY IF EXISTS "Conversation participants can delete"  ON public.conversations;

CREATE POLICY "Conversation participants can view"
  ON public.conversations FOR SELECT
  USING (auth.uid() = rider_id OR auth.uid() = driver_id);

CREATE POLICY "Riders can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = rider_id);

CREATE POLICY "Conversation participants can update"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = rider_id OR auth.uid() = driver_id);

CREATE POLICY "Conversation participants can delete"
  ON public.conversations FOR DELETE
  USING (auth.uid() = rider_id OR auth.uid() = driver_id);


-- ─── 2. EXTEND MESSAGES TABLE ─────────────────────────────────────────────────
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS type            TEXT NOT NULL DEFAULT 'text'
                                             CHECK (type IN ('text','offer','system')),
  ADD COLUMN IF NOT EXISTS offer_amount    NUMERIC,
  ADD COLUMN IF NOT EXISTS offer_status    TEXT
                                             CHECK (offer_status IN ('PENDING','COUNTERED','ACCEPTED','DECLINED'));

ALTER TABLE public.messages ALTER COLUMN ride_id DROP NOT NULL;


-- ─── 3. MESSAGES RLS ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Ride participants can message"                 ON public.messages;
DROP POLICY IF EXISTS "Conversation participants can message"         ON public.messages;
DROP POLICY IF EXISTS "Conversation participants can read messages"   ON public.messages;
DROP POLICY IF EXISTS "Users can send messages"                       ON public.messages;
DROP POLICY IF EXISTS "Conversation participants can update messages" ON public.messages;
DROP POLICY IF EXISTS "Conversation participants can delete messages" ON public.messages;

-- Any participant can read all messages in their conversations
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

-- Only sender can insert
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

-- Participants can update messages (offer status changes)
CREATE POLICY "Conversation participants can update messages"
  ON public.messages FOR UPDATE
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE rider_id = auth.uid() OR driver_id = auth.uid()
    )
  );

-- Participants can delete messages (used by closeConversation)
CREATE POLICY "Conversation participants can delete messages"
  ON public.messages FOR DELETE
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE rider_id = auth.uid() OR driver_id = auth.uid()
    )
  );


-- ─── 4. USERS RLS — allow reading other users' profiles ──────────────────────
DROP POLICY IF EXISTS "Users can read own profile"            ON public.users;
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.users;

CREATE POLICY "Authenticated users can read profiles"
  ON public.users FOR SELECT
  USING (auth.uid() IS NOT NULL);


-- ─── 5. NOTIFICATIONS TABLE ───────────────────────────────────────────────────
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

DROP POLICY IF EXISTS "Users can read own notifications"             ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications"           ON public.notifications;

CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);


-- ─── 6. ENABLE REALTIME (must come after tables exist) ───────────────────────
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN others THEN NULL;
END $$;


-- ─── 7. CLEAR STALE LOCAL SESSIONS ───────────────────────────────────────────
-- After running this migration, users must clear browser localStorage to avoid
-- stale local-mode conversations conflicting with Supabase data.
-- Open browser DevTools → Application → Local Storage → delete "unilift-local-chat-state"
-- Then hard-refresh the page.
