
import React from "react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = "md", 
  className 
}) => {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-10 w-10 border-3",
  };

  return (
    <div
      className={cn(
        "inline-block animate-spin rounded-full border-current border-t-transparent text-primary",
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="loading"
    />
  );
};
