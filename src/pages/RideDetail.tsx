import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, MapPin, Clock, DollarSign, Star, Phone, Mail } from "lucide-react";
import { Link } from "wouter";

export default function RideDetail() {
  const [match, params] = useRoute("/ride/:id");

  if (!match) return null;

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Back Button */}
        <Link href="/dashboard">
          <Button variant="ghost" className="mb-6 hover:scale-105">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="space-y-6">
          {/* Ride Header */}
          <div className="card-wireframe bg-gradient-to-br from-card/90 to-card/70">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">Ride #{params.id}</h1>
                <div className="inline-block px-4 py-2 border-2 border-accent bg-accent/10 text-sm font-bold rounded-lg">
                  Status: <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">SCHEDULED</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">$5.00</div>
                <div className="text-sm text-muted-foreground">per person</div>
              </div>
            </div>

            {/* Route Info */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium mb-1">Pickup Location</p>
                  <p className="text-muted-foreground">Campus North Gate, Building A</p>
                  <p className="text-sm text-muted-foreground">123 University Ave</p>
                </div>
              </div>

              <div className="border-l-2 border-border ml-2 h-8"></div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium mb-1">Drop-off Location</p>
                  <p className="text-muted-foreground">Downtown Shopping Center</p>
                  <p className="text-sm text-muted-foreground">456 Main Street</p>
                </div>
              </div>
            </div>

            {/* Time & Distance */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <div>
                  <p className="text-sm text-muted-foreground">Departure</p>
                  <p className="font-medium">Today, 2:30 PM</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <div>
                  <p className="text-sm text-muted-foreground">Distance</p>
                  <p className="font-medium">8.5 km</p>
                </div>
              </div>
            </div>
          </div>

          {/* Driver Info */}
          <div className="card-wireframe bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
            <h2 className="text-2xl font-bold mb-4">Driver Information</h2>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary via-secondary to-accent text-white flex items-center justify-center text-2xl font-bold rounded-xl shadow-lg">
                JD
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg">John Driver</h3>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-medium">4.9</span>
                      <span className="text-muted-foreground">(127 rides)</span>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-muted-foreground">Member since</p>
                    <p className="font-medium">Jan 2025</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>+1 (555) 123-4567</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>john.driver@university.edu</span>
                  </div>
                </div>

                <div className="mt-4 p-3 border border-border">
                  <p className="text-sm">
                    <span className="font-medium">Vehicle:</span> Toyota Camry 2022 (Blue)
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Plate:</span> ABC-1234
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Available Seats */}
          <div className="card-wireframe">
            <h2 className="text-2xl font-bold mb-4">Available Seats</h2>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((seat) => (
                <div
                  key={seat}
                  className={`w-16 h-16 border-2 flex items-center justify-center font-bold rounded-lg text-lg transition-all duration-200 ${
                    seat <= 2
                      ? "border-muted bg-muted text-muted-foreground"
                      : "border-primary bg-gradient-to-br from-primary/10 to-secondary/10 hover:scale-110 cursor-pointer shadow-lg"
                  }`}
                >
                  {seat}
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              2 seats available out of 4
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button className="w-full h-14 text-lg shadow-xl hover:shadow-2xl">Request This Ride</Button>
            <Button variant="outline" className="w-full h-14 text-lg">
              Contact Driver
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
