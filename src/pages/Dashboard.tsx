import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { MapPin, Plus, Clock, User, Navigation as NavigationIcon } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {user.role === "admin" ? "Admin Dashboard" : `${user.role === "rider" ? "Find a Ride" : "Offer a Ride"}`}
          </h1>
          <p className="text-muted-foreground text-lg">
            Welcome back, <span className="font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{user.fullName}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map Placeholder */}
            <div className="card-wireframe h-96 flex items-center justify-center bg-gradient-to-br from-card/50 to-card/80 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5"></div>
              <div className="text-center relative z-10">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 flex items-center justify-center">
                  <MapPin className="h-10 w-10 text-primary" />
                </div>
                <p className="text-xl font-mono font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">MAP VIEW</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Interactive map showing available rides
                </p>
              </div>
            </div>

            {/* Action Button */}
            {user.role !== "admin" && (
              <div className="card-wireframe p-6 bg-gradient-to-br from-card/80 to-card/60">
                <Button className="w-full h-16 text-lg shadow-xl hover:shadow-2xl">
                  <Plus className="mr-2 h-6 w-6" />
                  {user.role === "rider" ? "Request a Ride" : "Offer a Ride"}
                </Button>
              </div>
            )}

            {/* Rides List */}
            <div className="card-wireframe">
              <h2 className="text-2xl font-bold mb-4">
                {user.role === "rider" ? "Available Rides" : user.role === "driver" ? "Your Rides" : "Recent Rides"}
              </h2>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Link key={i} href={`/ride/${i}`}>
                    <div className="border border-border p-4 rounded-xl hover:bg-gradient-to-r hover:from-primary/10 hover:via-secondary/10 hover:to-accent/10 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] bg-card/50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <span className="font-medium">Driver Name {i}</span>
                        </div>
                        <span className="text-sm font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">$5.00</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <NavigationIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <p>From: Campus North Gate</p>
                          <p>To: Downtown Shopping Center</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Departure: 2:30 PM</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* SOS Button */}
            <div className="card-wireframe bg-gradient-to-br from-card/80 to-card/60">
              <button className="sos-button w-full">
                🚨 EMERGENCY SOS
              </button>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Press in case of emergency
              </p>
            </div>

            {/* Quick Stats */}
            <div className="card-wireframe bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
              <h3 className="font-bold mb-4 text-lg">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between p-3 rounded-lg bg-card/50 border border-border/50">
                  <span className="text-muted-foreground">Total Rides</span>
                  <span className="font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">24</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-card/50 border border-border/50">
                  <span className="text-muted-foreground">Rating</span>
                  <span className="font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">4.8 ⭐</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-card/50 border border-border/50">
                  <span className="text-muted-foreground">Member Since</span>
                  <span className="font-bold">Jan 2026</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card-wireframe">
              <h3 className="font-bold mb-4">Recent Activity</h3>
              <div className="space-y-2 text-sm">
                <div className="border-l-2 border-primary pl-3 py-1">
                  <p className="font-medium">Ride completed</p>
                  <p className="text-muted-foreground text-xs">2 hours ago</p>
                </div>
                <div className="border-l-2 border-border pl-3 py-1">
                  <p className="font-medium">Payment received</p>
                  <p className="text-muted-foreground text-xs">5 hours ago</p>
                </div>
                <div className="border-l-2 border-border pl-3 py-1">
                  <p className="font-medium">Rating submitted</p>
                  <p className="text-muted-foreground text-xs">1 day ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
