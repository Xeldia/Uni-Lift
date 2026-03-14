import { createBrowserRouter } from "react-router";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { MessagesPage } from "./pages/MessagesPage";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { VerificationsPage } from "./pages/VerificationsPage";
import { UsersPage } from "./pages/UsersPage";
import { RidesPage } from "./pages/RidesPage";
import { SOSAlertsPage } from "./pages/SOSAlertsPage";

export const router = createBrowserRouter([
  // User Routes
  { path: "/", Component: LoginPage },
  { path: "/home", Component: HomePage },
  { path: "/messages", Component: MessagesPage },
  { path: "/settings", Component: Settings },
  { path: "/profile", Component: Profile },
  
  // Admin Routes
  { path: "/admin", Component: AdminDashboardPage },
  { path: "/admin/verifications", Component: VerificationsPage },
  { path: "/admin/users", Component: UsersPage },
  { path: "/admin/rides", Component: RidesPage },
  { path: "/admin/sos", Component: SOSAlertsPage },
]);
