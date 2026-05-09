import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { enforceSessionPolicy, getSession, getUserRole } from "../../../shared/lib/supabase";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Set to true for routes that only admins may access */
  adminOnly?: boolean;
}

/**
 * Wraps a route and redirects unauthenticated users to the login page (/).
 * If adminOnly is true, it also verifies the user has an admin role and
 * redirects non-admins to /home.
 *
 * Renders null (blank) while the session check is in flight to avoid a
 * flash of protected content.
 */
export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getSession().then((session) => {
      if (cancelled) return;

      // No session → send to login
      if (!session) {
        navigate("/", { replace: true });
        return;
      }

      (async () => {
        // Enforce "stay active" policy: non-persistent sessions are invalidated
        const signedOut = await enforceSessionPolicy();
        if (cancelled) return;
        if (signedOut) {
          navigate("/", { replace: true });
          return;
        }

        const dbRole = await getUserRole(session.user.id);
        if (cancelled) return;
        const isAdmin = (dbRole ?? "").toUpperCase() === "ADMIN";

        // If admin-only route: block non-admins.
        if (adminOnly && !isAdmin) {
          navigate("/home", { replace: true });
          return;
        }

        // If *not* admin-only route: keep admins out of the normal app shell.
        // They should land on the admin operations dashboard instead.
        if (!adminOnly && isAdmin && !location.pathname.startsWith("/admin")) {
          navigate("/admin", { replace: true });
          return;
        }

        setChecking(false);
      })();
    });

    return () => { cancelled = true; };
  }, [navigate, adminOnly, location.pathname]);

  // Blank screen while we verify — prevents flash of protected content
  if (checking) return null;

  return <>{children}</>;
}
