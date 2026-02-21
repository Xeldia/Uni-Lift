import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center border transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none font-medium";
    
    const variants = {
      default: "border-primary bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary shadow-md hover:shadow-lg hover:scale-105",
      ghost: "border-transparent hover:bg-accent/10 hover:text-accent",
      outline: "border-border bg-card/50 backdrop-blur-sm hover:bg-accent/20 hover:border-accent shadow-sm",
      destructive: "border-destructive bg-gradient-to-r from-destructive to-destructive/90 text-destructive-foreground hover:from-destructive/90 hover:to-destructive shadow-md hover:shadow-lg",
    };

    const sizes = {
      default: "h-10 px-4 py-2 text-sm rounded-lg",
      sm: "h-8 px-3 text-xs rounded-md",
      lg: "h-12 px-8 text-base rounded-xl",
      icon: "h-10 w-10 rounded-lg",
    };

    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
