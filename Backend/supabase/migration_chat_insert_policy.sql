-- Fix chat creation RLS so either participant can create a conversation.
-- Run in Supabase SQL Editor.

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Riders can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Conversation participants can create conversations" ON public.conversations;

CREATE POLICY "Conversation participants can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = rider_id OR auth.uid() = driver_id);

