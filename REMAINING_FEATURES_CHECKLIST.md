# Uni-Lift Project Progress Checklist

Last reviewed against the current workspace on 2026-05-09 (updated).

Status legend:
- Done: implemented in the current frontend/backend.
- Partial: visible implementation exists, but at least one acceptance detail is still missing.
- Not started: no meaningful implementation found in the current project.

## Current Project Snapshot

- Frontend has been moved into a feature-based React/Vite app under `Frontend/src`, with shared layout/components in `Frontend/src/shared`.
- Backend has been moved into a feature-based Express/Supabase API under `Backend/src/features`, with shared config/security/common code under `Backend/src/core`.
- Root `package.json` now runs backend and frontend together through `npm run dev:all`.
- New operational docs exist: `DEPLOYMENT_RUNBOOK.md`, `OPERATIONS_CHECKLIST.md`, and `Frontend/RUN_UNILIFT_FRONTEND.md`.
- Supabase migrations now cover driver presence, admin role support, timed suspension, driver verification workflow, driver-to-rider rating, rating refresh RPC, fare negotiation, and RLS/presence fixes.
- Frontend diagnostics cleanup: added TypeScript deprecation suppression for `baseUrl` and prop validation for `Navigation`.

## Done

- [x] Passenger count selection
  - Rider booking form has a 1–4 passenger selector (`passengerCount` state in `HomePage.jsx`).
  - Count is posted with `postRideRequest` as `passenger_count` and displayed in the driver's accepted-ride and trip-in-progress panels.
  - Driver feed request cards show PAX count per ride.

- [x] Driver map animated route during trip
  - Driver's map now uses `AnimatedRoute` (dashed animated blue line) when a trip is in progress, matching the rider's view.
  - Simulation GPS positions are forwarded to the map via `onSimulationPosition` callback so the amber car marker moves during SIMULATE TRIP.

- [x] Driver post-trip rider rating submission
  - Driver trip summary includes a "Rate Rider" star/tag form in `DriverRequestFeed.tsx`.
  - Ratings persist through `submitDriverRiderRating`, using `rides.driver_rating` and `rides.driver_tags`.
  - Saved driver-to-rider ratings are now visible in ride history.
  - Aggregate user rating refresh is wired through `refresh_user_rating_from_rides`.

- [x] Driver verification status gate
  - Driver mode is blocked unless `driver_verification_status` is `APPROVED`.
  - Pending and rejected states are shown in the driver verification modal.
  - Rejection reason is shown when present.
  - Realtime user row updates can force a demoted/revoked driver back to rider mode.
  - Driver requests now require uploaded driver license and plate/vehicle verification files before submission.

- [x] Driver verification document review
  - Driver registration uploads license and plate/vehicle files to Supabase Storage.
  - Admin driver verification queue receives document URLs from the backend.
  - Admin verification detail view includes full-size image/PDF preview for uploaded driver documents.

- [x] Vehicle registration and management UI
  - Profile now includes editable vehicle model/plate and vehicle type fields.
  - Vehicle data persists to `users.vehicle` and `users.vehicle_type`.
  - Driver feed blocks online/taking-orders status until required vehicle data is saved.

- [x] Admin user suspension/reactivation
  - Admin Users panel can suspend users with reason and duration.
  - Suspended users can be reactivated.
  - Backend blocks suspending admin users.

- [x] Admin role change UI and API
  - Admin Users panel exposes Rider/Driver/Both/Admin role changes.
  - Backend updates driver verification state when granting/removing driver-capable roles.

- [x] SOS realtime monitor and resolve workflow
  - Admin SOS page subscribes to `sos_alerts`.
  - Alerts can be filtered by status and resolved with a note.

- [x] SOS alert history/audit search
  - Admin SOS page supports search across alert, user, ride, location, status, and notes.
  - Added status/type/date filtering for active and historical alert review.
  - Filtered alert results can be exported to CSV for incident reporting.

- [x] Rider-to-driver rating flow
  - Rider rating phase exists after trip completion.
  - Rider rating persists to `rides.rider_rating` / `rides.rider_tags` and refreshes driver rating.

- [x] Ride map view in Admin Rides
  - `getAdminRides` now selects stored pickup/dropoff and live driver coordinates.
  - Admin ride details render a compact `CampusMap` route preview when coordinates exist.
  - Base Supabase schema now includes ride coordinate columns for fresh setup parity.
  - Rides without stored coordinates show a clear fallback state.

- [x] Terms / Privacy / Support links in login footer
  - Login footer buttons now navigate to `/terms`, `/privacy`, and `/support`.
  - Added public legal/support pages with Uni-Lift-specific content and back-to-login navigation.

- [x] Password strength indicator in registration
  - Signup now shows a five-step strength meter for the access key/password field.
  - Meter checks length, uppercase, lowercase, number, and symbol coverage.

- [x] Replace `alert()` usage with in-app toast UI
  - Added the global Sonner toaster to the app shell.
  - Driver ride action errors, rider sign-in guard, and SOS resolve errors now use toasts.

- [x] Messenger-style request and offer flow
  - Messages page now supports registered-user search, request threads, three-message request caps, cooldowns, request-response notifications, and the offer composer modal with pickup/drop-off/passenger details.
  - Chat now falls back to local storage when the Supabase chat tables have not been synced yet, and the matching SQL migration is in `Backend/supabase/002_chat_schema_sync.sql`.

## Partial

- [ ] Applicant notification on verification decision
  - Partial: realtime user updates notify active sessions and the driver modal shows pending/rejected states.
  - Missing: no email, push, notification-center, or persisted in-app notification is generated on approve/reject.

- [ ] Admin delete/deactivate user capability
  - Partial: timed suspension/reactivation acts as soft deactivation.
  - Missing: no delete action and no dedicated reversible deactivation state separate from suspension.

- [x] Admin role-change guardrails and audit log
  - Protected-admin demotion is blocked, active-ride changes are rejected, and role changes are written to `admin_role_audit`.

 - [ ] Scheduled/future booking (deprecated)
  - Note: scheduling support has been removed from the frontend — `scheduled_at` remains in the schema for backwards compatibility but the UI/workflow for scheduling has been deprecated.

- [ ] Richer earnings analytics for drivers
  - Partial: driver request feed shows today's completed ride count and earnings.
  - Missing: broader analytics over date ranges, charts, and exports.

## Work started (scaffolded / in-progress)

- [ ] Applicant notification on verification decision — In progress
  - Status: frontend helper and SQL scaffolding recommended for a `notifications` table; helper will be added to `Frontend/src/shared/lib/supabase.ts`.
  - Next: wire admin approve/reject flows to insert notifications and add email/push adapters.

- [ ] Admin delete/deactivate user capability — In progress
  - Status: soft-deactivate plan drafted; frontend helper will update `users.deactivated` (server-side RLS and audit needed).
  - Next: add server-side guard to block active rides and a reversible `deactivated` flag in `users`.

## Not Started / Still Missing

- [ ] SOS assignment workflow
  - No assignee fields, assignment UI, or assignment API found.

- [ ] SOS push notifications for admins
  - Realtime page subscription exists, but there is no push/browser notification fallback outside the open admin page.

- [ ] Responsive layout pass
  - Several admin/detail panels still use fixed widths and desktop-first split panes.

- [ ] Notification center
  - Settings has a notification toggle, but no notification center or persisted notifications.

## Recommended Next Sprint Order

1. Add applicant notifications for verification decisions.
2. Finish admin delete/deactivate UX and the reversible deactivation state.
3. Add SOS assignment workflow and admin push/browser notifications.
4. Add passenger count and richer fare/booking flows (scheduling deprecated).
5. Add a responsive pass for admin/detail pages.
