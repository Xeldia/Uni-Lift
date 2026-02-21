import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card-wireframe text-center max-w-md bg-gradient-to-br from-card/90 to-card/70">
        <div className="text-7xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">404</div>
        <h1 className="text-3xl font-bold mb-2">Page Not Found</h1>
        <p className="text-muted-foreground mb-6 text-lg">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/dashboard">
          <Button className="shadow-xl hover:shadow-2xl">
            <Home className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
