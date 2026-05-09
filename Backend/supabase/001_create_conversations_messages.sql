-- 001_create_conversations_messages.sql
-- Creates conversations and messages tables for in-app chat / negotiation

-- Conversations table (one row per rider-driver conversation)
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  driver_initials text,
  driver_name text,
  vehicle text,
  plate text,
  rating numeric,
  status text DEFAULT 'NEGOTIATING',
  last_message text,
  pickup text,
  dropoff text,
  price numeric,
  distance numeric,
  updated_at timestamptz DEFAULT now()
);

-- Messages table (chat history for each conversation)
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender text NOT NULL,       -- 'self' | 'driver' | 'system'
  type text NOT NULL,         -- 'text' | 'offer' | 'system'
  content text,
  offer_amount numeric,
  offer_status text,
  created_at timestamptz DEFAULT now()
);

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_rider_id ON public.conversations(rider_id);
CREATE INDEX IF NOT EXISTS idx_conversations_driver_id ON public.conversations(driver_id);

-- NOTE: Enable RLS and policies after deploying these tables. Example policies:
-- ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
--
-- Example SELECT policy for conversations (participants only):
-- CREATE POLICY "conversations_select_for_participants" ON public.conversations
--   FOR SELECT USING (auth.uid() = rider_id OR auth.uid() = driver_id);
--
-- Example INSERT/SELECT policy for messages (participants only):
-- CREATE POLICY "messages_insert_for_participants" ON public.messages
--   FOR INSERT WITH CHECK (
--     EXISTS (
--       SELECT 1 FROM public.conversations
--       WHERE id = conversation_id AND (rider_id = auth.uid() OR driver_id = auth.uid())
--     )
--   );
