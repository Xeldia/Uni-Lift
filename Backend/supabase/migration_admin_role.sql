-- Allow 'admin' in users.role so frontend admin gate works.
-- Run this in Supabase SQL editor.

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('rider', 'driver', 'both', 'admin'));

