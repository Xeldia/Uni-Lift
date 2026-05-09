-- 002_create_notifications_and_user_deactivate.sql
-- Adds notifications table and soft-deactivate columns to users

-- Notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  metadata jsonb DEFAULT '{}' NOT NULL,
  read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- Soft-deactivate fields on users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS deactivated boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS deactivated_reason text,
  ADD COLUMN IF NOT EXISTS deactivated_at timestamptz;

-- Optional admin role audit table
CREATE TABLE IF NOT EXISTS public.admin_role_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id),
  target_user_id uuid REFERENCES auth.users(id),
  previous_roles text[],
  new_roles text[],
  reason text,
  created_at timestamptz DEFAULT now()
);

-- Example RLS notes:
-- ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "notifications_select_user" ON public.notifications FOR SELECT USING (user_id = auth.uid());
-- CREATE POLICY "notifications_insert_service" ON public.notifications FOR INSERT USING (auth.role() = 'service_role' OR true);

-- Tweak policies to ensure only service/admin roles can insert sensitive notifications,
-- and regular users can only SELECT their own notifications.
