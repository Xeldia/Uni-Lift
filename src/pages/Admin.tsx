import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Users, Car, AlertTriangle, TrendingUp, CheckCircle } from "lucide-react";

export default function AdminPage() {
  const { user } = useAuth();

  if (user?.role !== "admin") {
    return (
      <div className="pt-16 min-h-screen flex items-center justify-center">
        <div className="card-wireframe text-center bg-gradient-to-br from-card/90 to-card/70 max-w-md">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-destructive/20 to-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground text-lg">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground text-lg">Manage users, rides, and system settings</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card-wireframe bg-gradient-to-br from-primary/10 to-primary/5 hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-6 w-6 text-primary" />
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
            <div className="text-3xl font-bold mb-1 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">1,234</div>
            <div className="text-sm text-muted-foreground">Total Users</div>
          </div>

          <div className="card-wireframe bg-gradient-to-br from-secondary/10 to-secondary/5 hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between mb-2">
              <Car className="h-6 w-6 text-secondary" />
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
            <div className="text-3xl font-bold mb-1 bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">567</div>
            <div className="text-sm text-muted-foreground">Active Rides</div>
          </div>

          <div className="card-wireframe bg-gradient-to-br from-accent/10 to-accent/5 hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-6 w-6 text-accent" />
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="text-3xl font-bold mb-1 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">8,901</div>
            <div className="text-sm text-muted-foreground">Completed Rides</div>
          </div>

          <div className="card-wireframe bg-gradient-to-br from-destructive/10 to-destructive/5 hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <span className="text-xs font-bold px-2 py-1 border-2 border-destructive bg-destructive/20 rounded-md text-destructive">NEW</span>
            </div>
            <div className="text-3xl font-bold mb-1 bg-gradient-to-r from-destructive to-destructive/70 bg-clip-text text-transparent">3</div>
            <div className="text-sm text-muted-foreground">Pending Reports</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="card-wireframe bg-gradient-to-br from-card/90 to-card/70">
            <h2 className="text-2xl font-bold mb-4">Recent Users</h2>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center font-bold rounded-lg shadow-md">
                      U{i}
                    </div>
                    <div>
                      <p className="font-medium">User Name {i}</p>
                      <p className="text-sm text-muted-foreground">user{i}@university.edu</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs px-2 py-1 border border-border rounded-md font-bold bg-gradient-to-r from-primary/10 to-secondary/10">
                      {i % 2 === 0 ? "RIDER" : "DRIVER"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Users
            </Button>
          </div>

          {/* Recent Rides */}
          <div className="card-wireframe bg-gradient-to-br from-card/90 to-card/70">
            <h2 className="text-2xl font-bold mb-4">Recent Rides</h2>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="border-b border-border pb-3 last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">Ride #{1000 + i}</p>
                      <p className="text-sm text-muted-foreground">Driver Name {i}</p>
                    </div>
                    <div className="text-xs px-2 py-1 border border-border rounded-md font-bold bg-gradient-to-r from-accent/20 to-primary/20">
                      {i % 3 === 0 ? "COMPLETED" : i % 2 === 0 ? "ACTIVE" : "SCHEDULED"}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>From: Campus → To: Downtown</p>
                    <p className="text-xs mt-1">{i} hours ago</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Rides
            </Button>
          </div>

          {/* System Status */}
          <div className="card-wireframe bg-gradient-to-br from-accent/5 to-primary/5">
            <h2 className="text-2xl font-bold mb-4">System Status</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">API Status</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  <span className="font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">Operational</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Database</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-bold">Connected</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Payment Gateway</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-bold">Active</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Notifications</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-bold">Enabled</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card-wireframe bg-gradient-to-br from-card/90 to-card/70">
            <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Car className="mr-2 h-4 w-4" />
                Manage Rides
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <AlertTriangle className="mr-2 h-4 w-4" />
                View Reports
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="mr-2 h-4 w-4" />
                Analytics
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
