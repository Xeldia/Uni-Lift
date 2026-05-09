-- Driver -> Rider post-trip rating support
-- Safe to run multiple times

ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS driver_rating NUMERIC(2,1),
  ADD COLUMN IF NOT EXISTS driver_tags   TEXT[];
