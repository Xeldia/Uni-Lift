import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth, UserRole } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("rider");
  const [error, setError] = useState("");
  
  const { login, signup, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(name, email, password, role);
      }
      setLocation("/dashboard");
    } catch (err) {
      setError("Authentication failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card-wireframe w-full max-w-md bg-gradient-to-br from-card/90 to-card/70">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center text-white shadow-lg">
              <span className="font-display font-bold text-2xl">U</span>
            </div>
            <h1 className="text-3xl font-bold">Uni-Lift</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            {isLogin ? "Sign in to your account" : "Create a new account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="John Doe"
                className="w-full h-11"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@university.edu"
              className="w-full h-11"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full h-11"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full h-11"
              >
                <option value="rider">Rider</option>
                <option value="driver">Driver</option>
              </select>
            </div>
          )}

          {error && (
            <div className="border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive rounded-lg">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full h-12 text-base shadow-xl" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait...
              </>
            ) : (
              <>{isLogin ? "Sign In" : "Sign Up"}</>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-muted-foreground hover:text-foreground border-0 bg-transparent p-0"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
