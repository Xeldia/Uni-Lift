-- Add optional end-time for timed account suspensions.
-- Run this in Supabase SQL editor.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;

