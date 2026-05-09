-- Refresh account rating from completed ride ratings using SECURITY DEFINER
-- This avoids client-side RLS issues when updating another user's profile rating.

CREATE OR REPLACE FUNCTION public.refresh_user_rating_from_rides(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  computed_avg NUMERIC(3,2);
BEGIN
  SELECT
    COALESCE(ROUND(AVG(score)::numeric, 2), 0)
  INTO computed_avg
  FROM (
    SELECT rider_rating AS score
    FROM public.rides
    WHERE status = 'COMPLETED'
      AND driver_id = target_user_id
      AND rider_rating IS NOT NULL
    UNION ALL
    SELECT driver_rating AS score
    FROM public.rides
    WHERE status = 'COMPLETED'
      AND rider_id = target_user_id
      AND driver_rating IS NOT NULL
  ) scores;

  UPDATE public.users
  SET rating = computed_avg,
      updated_at = NOW()
  WHERE id = target_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_user_rating_from_rides(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_user_rating_from_rides(UUID) TO authenticated;
