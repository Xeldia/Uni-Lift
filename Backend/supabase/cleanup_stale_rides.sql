-- Cancel all SEARCHING rides that have been waiting for more than 20 minutes.
-- Run this once in Supabase SQL Editor to clean up the orphaned ride from before.
UPDATE public.rides
SET
  status       = 'CANCELLED',
  cancelled_at = NOW(),
  cancel_reason = 'Auto-cancelled: no driver found within 20 minutes'
WHERE
  status = 'SEARCHING'
  AND created_at < NOW() - INTERVAL '20 minutes';
