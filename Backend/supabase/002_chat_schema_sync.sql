-- 002_chat_schema_sync.sql
-- Syncs the Supabase project with the current in-app chat schema.
-- Run this in the Supabase SQL Editor if conversations/messages are missing.

-- Conversations table: one row per rider/driver thread.
CREATE TABLE IF NOT EXISTS public.conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  driver_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'NEGOTIATING'
                    CHECK (status IN ('REQUESTED', 'NEGOTIATING', 'AGREED', 'COMPLETED', 'CANCELLED')),
  pickup          TEXT,
  dropoff         TEXT,
  pickup_lat      NUMERIC,
  pickup_lng      NUMERIC,
  dropoff_lat     NUMERIC,
  dropoff_lng     NUMERIC,
  agreed_fare     NUMERIC,
  ride_id         UUID REFERENCES public.rides(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (rider_id, driver_id)
);

ALTER TABLE public.conversations
  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Conversation participants can view" ON public.conversations;
CREATE POLICY "Conversation participants can view"
  ON public.conversations FOR SELECT
  USING (auth.uid() = rider_id OR auth.uid() = driver_id);

DROP POLICY IF EXISTS "Riders can create conversations" ON public.conversations;
CREATE POLICY "Riders can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = rider_id);

DROP POLICY IF EXISTS "Conversation participants can update" ON public.conversations;
CREATE POLICY "Conversation participants can update"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = rider_id OR auth.uid() = driver_id);

CREATE INDEX IF NOT EXISTS idx_conversations_rider_id ON public.conversations(rider_id);
CREATE INDEX IF NOT EXISTS idx_conversations_driver_id ON public.conversations(driver_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);

-- Messages table: chat history, offers, and system events for a conversation.
CREATE TABLE IF NOT EXISTS public.messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  ride_id         UUID REFERENCES public.rides(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'text'
                    CHECK (type IN ('text', 'offer', 'system')),
  offer_amount    NUMERIC,
  offer_status    TEXT
                    CHECK (offer_status IN ('PENDING', 'COUNTERED', 'ACCEPTED', 'DECLINED')),
  sent_at         TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'text'
    CHECK (type IN ('text', 'offer', 'system')),
  ADD COLUMN IF NOT EXISTS offer_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS offer_status TEXT
    CHECK (offer_status IN ('PENDING', 'COUNTERED', 'ACCEPTED', 'DECLINED')),
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.messages
  ALTER COLUMN ride_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON public.messages(sent_at DESC);

ALTER TABLE public.messages
  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ride participants can message" ON public.messages;
DROP POLICY IF EXISTS "Conversation participants can message" ON public.messages;
CREATE POLICY "Conversation participants can message"
  ON public.messages FOR ALL
  USING (
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

-- Optional compatibility cleanup for older schemas.
ALTER TABLE public.messages
  DROP COLUMN IF EXISTS sender;
