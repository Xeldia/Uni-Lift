import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import AuthPage from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import RideDetail from "@/pages/RideDetail";
import AdminPage from "@/pages/Admin";
import NotFound from "@/pages/NotFound";

function Router() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <Navigation />
      <Switch>
        <Route path="/auth" component={AuthPage} />
        
        <Route path="/">
          <Redirect to="/dashboard" />
        </Route>
        
        <ProtectedRoute path="/dashboard" component={Dashboard} />
        <ProtectedRoute path="/ride/:id" component={RideDetail} />
        <ProtectedRoute path="/admin" component={AdminPage} />
        
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
