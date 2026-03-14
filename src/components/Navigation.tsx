import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  LogOut, 
  MapPin, 
  Car, 
  Shield, 
  Menu
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navigation() {
  const { user, logout, updateRole } = useAuth();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  if (!user || location === "/auth") return null;

  const handleRoleSwitch = () => {
    const newRole = user.role === "rider" ? "driver" : "rider";
    updateRole(newRole);
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-200">
              <span className="font-display font-bold text-xl">U</span>
            </div>
            <span className="font-display font-bold text-xl bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">Uni-Lift</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            {user.role === "admin" ? (
               <Link href="/admin">
                <Button variant="ghost" className={location === "/admin" ? "bg-primary/10 text-primary border-primary/30" : ""}>
                  <Shield className="mr-2 h-4 w-4" /> Admin Panel
                </Button>
               </Link>
            ) : (
              <>
                <div className="px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 text-sm font-medium border border-primary/30 shadow-sm">
                  Mode: <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-bold capitalize">{user.role}</span>
                </div>
                
                <Button variant="outline" onClick={handleRoleSwitch} className="hover:border-primary/50">
                  Switch to {user.role === "rider" ? "Driver" : "Rider"}
                </Button>
              </>
            )}
            
            <Button variant="ghost" size="icon" onClick={() => logout()} title="Logout">
              <LogOut className="h-5 w-5 text-muted-foreground hover:text-destructive transition-colors" />
            </Button>
          </div>

          {/* Mobile Nav */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col gap-6 mt-8">
                  <div className="flex items-center gap-3 pb-6 border-b">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary via-secondary to-accent text-white flex items-center justify-center font-bold text-xl shadow-lg">
                      {user.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-lg">{user.fullName}</p>
                      <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
                    </div>
                  </div>

                  <nav className="flex flex-col gap-2">
                    <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-lg h-12">
                        <MapPin className="mr-3 h-5 w-5" /> Dashboard
                      </Button>
                    </Link>
                    
                    {user.role === "admin" && (
                      <Link href="/admin" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start text-lg h-12">
                          <Shield className="mr-3 h-5 w-5" /> Admin Panel
                        </Button>
                      </Link>
                    )}

                    <div className="my-4 border-t border-border/50"></div>

                    {user.role !== "admin" && (
                      <Button 
                        variant="outline" 
                        className="w-full justify-start h-12 border-primary/20"
                        onClick={handleRoleSwitch}
                      >
                        <Car className="mr-3 h-5 w-5" /> Switch to {user.role === "rider" ? "Driver" : "Rider"}
                      </Button>
                    )}
                    
                    <Button 
                      variant="destructive" 
                      className="w-full justify-start mt-4 h-12"
                      onClick={() => {
                        logout();
                        setIsOpen(false);
                      }}
                    >
                      <LogOut className="mr-3 h-5 w-5" /> Logout
                    </Button>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
