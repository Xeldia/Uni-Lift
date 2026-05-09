import { createBrowserRouter } from "react-router";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { ResetPasswordPage } from "../features/auth/pages/ResetPasswordPage";
import { HomePage } from "../features/home/pages/HomePage";
import { MessagesPage } from "../features/messages/pages/MessagesPage";
import Settings from "../features/settings/pages/Settings";
import Profile from "../features/profile/pages/Profile";
import { AdminDashboardPage } from "../features/admin/pages/AdminDashboardPage";
import { VerificationsPage } from "../features/admin/pages/VerificationsPage";
import { UsersPage } from "../features/admin/pages/UsersPage";
import { RidesPage } from "../features/admin/pages/RidesPage";
import { SOSAlertsPage } from "../features/admin/pages/SOSAlertsPage";
import { RideHistoryPage } from "../features/rides/pages/RideHistoryPage";
import { ProtectedRoute } from "../features/auth/components/ProtectedRoute";
import { LegalPage } from "../features/legal/pages/LegalPage";

// ── Helper wrappers ─────────────────────────────────────────────────────────────
const guard = (Page) => ({ Component: () => <ProtectedRoute><Page /></ProtectedRoute> });
const admin = (Page) => ({ Component: () => <ProtectedRoute adminOnly><Page /></ProtectedRoute> });

export const router = createBrowserRouter([
  // ── Public routes (no session required) ────────────────────────────────────
  { path: "/",               Component: LoginPage },
  { path: "/reset-password", Component: ResetPasswordPage },
  { path: "/terms",          Component: () => <LegalPage type="terms" /> },
  { path: "/privacy",        Component: () => <LegalPage type="privacy" /> },
  { path: "/support",        Component: () => <LegalPage type="support" /> },

  // ── Authenticated user routes ───────────────────────────────────────────────
  { path: "/home",               ...guard(HomePage) },
  { path: "/messages",           ...guard(MessagesPage) },
  { path: "/messages/:driverId", ...guard(MessagesPage) },
  { path: "/settings",           ...guard(Settings) },
  { path: "/profile",            ...guard(Profile) },
  { path: "/history",            ...guard(RideHistoryPage) },

  // ── Admin-only routes ───────────────────────────────────────────────────────
  { path: "/admin",                 ...admin(AdminDashboardPage) },
  { path: "/admin/verifications",   ...admin(VerificationsPage) },
  { path: "/admin/users",           ...admin(UsersPage) },
  { path: "/admin/rides",           ...admin(RidesPage) },
  { path: "/admin/sos",             ...admin(SOSAlertsPage) },
]);
