# Uni-Lift Deployment Runbook

## 1) Pre-Deploy Gate
- Ensure `Frontend` and `Backend` are on the release commit.
- Confirm env templates exist:
  - `Frontend/.env.example`
  - `Backend/.env.example`
- Run local build checks:
  - `cd Frontend && npm ci && npm run check:build`
  - `cd Backend && npm ci && npm run check:build`

## 2) Supabase Production Setup
- Open Supabase SQL editor and apply scripts in this order:
  1. `Backend/supabase/schema.sql`
  2. Remaining migration files in `Backend/supabase/` (oldest first).
- Verify RLS/policies for:
  - `users`
  - `rides`
  - `sos_alerts`
  - `verifications`-related reads/writes
- Configure Auth URLs:
  - Site URL: frontend production domain
  - Redirect URL: `https://<frontend-domain>/reset-password`
- Ensure storage buckets exist:
  - `avatars`
  - `verification-docs`

## 3) Backend Deploy (Render/Railway)
- Service root: `Backend`
- Build command: `npm ci && npm run build`
- Start command: `npm start`
- Required env vars:
  - `NODE_ENV=production`
  - `PORT=3001` (or platform default)
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `CORS_ORIGIN=https://<frontend-domain>`
- Verify health:
  - `GET https://<backend-domain>/health`

## 4) Frontend Deploy (Vercel)
- Project root: `Frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Required env vars:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_API_BASE_URL=https://<backend-domain>`

## 5) Production Smoke Checklist
- Authentication:
  - Login works
  - Reset password email works and redirect lands on `/reset-password`
- Rider/Driver lifecycle:
  - Rider posts request
  - Driver sees request and accepts
  - Driver starts and ends trip
  - Rider can submit rating
- SOS:
  - Rider or driver triggers SOS
  - Admin sees active alert
  - Admin resolves alert and clients receive resolved state
- Admin:
  - Users page suspend/reactivate works
  - Users export CSV works
  - Rides page force-end and export CSV work
  - Verifications page approve/reject works

## 6) Rollback
- Frontend: redeploy last known-good Vercel deployment.
- Backend: redeploy previous service release.
- Supabase:
  - If schema migration caused failure, restore from backup snapshot or execute rollback SQL.
  - Rotate keys if compromise is suspected.
