# Uni-Lift Operations Checklist

## Monitoring Baseline
- Backend uptime monitor on `/health` (1-minute interval).
- Alert if `/health` fails 3 consecutive checks.
- Track backend error logs for:
  - 5xx responses
  - auth failures
  - SOS endpoint failures

## Incident Playbook
1. Acknowledge alert and timestamp incident start.
2. Classify severity:
   - P1: SOS flow or login unavailable
   - P2: Partial admin/user workflow degradation
3. Contain:
   - Roll back frontend/backend if latest deploy is root cause.
   - Disable unstable feature flags/routes if needed.
4. Recover:
   - Validate health endpoint
   - Run smoke tests for auth, ride flow, SOS
5. Close:
   - Record root cause
   - Add preventive task to backlog

## Key Rotation
- Rotate Supabase service role key on compromise suspicion.
- Update key in backend platform env vars.
- Restart backend service.
- Verify `/health` and authenticated APIs.

## Launch Sign-off
- Functional smoke tests: pass
- Security checks (env/CORS/role gates): pass
- Build reproducibility (`check:build`): pass
- Documentation handoff completed
