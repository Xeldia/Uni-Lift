import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Route, useLocation } from "wouter";
import { ReactNode } from "react";

export function ProtectedRoute({ 
  path, 
  component: Component,
  children 
}: { 
  path?: string; 
  component?: () => ReactNode;
  children?: ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Redirect handled by effect in practice, but rendering null avoids flash
    setTimeout(() => setLocation("/auth"), 0);
    return null;
  }

  const content = Component ? <Component /> : children;

  return path ? <Route path={path}>{content}</Route> : <>{content}</>;
}
