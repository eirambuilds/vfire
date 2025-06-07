
import React from 'react';
import { cn } from "@/lib/utils";
import { Link } from 'react-router-dom';

type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isUpward: boolean;
  };
  className?: string;
  onClick?: () => void;
  isLoading?: boolean;
  linkTo?: string;
};

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
  onClick,
  isLoading = false,
  linkTo
}: StatCardProps) {
  const CardWrapper = ({ children }: { children: React.ReactNode }) => {
    if (linkTo) {
      return (
        <Link to={linkTo} className="block w-full">
          {children}
        </Link>
      );
    }
    
    return (
      <div onClick={onClick}>
        {children}
      </div>
    );
  };
  
  return (
    <CardWrapper>
      <div 
        className={cn(
          "stat-card relative p-6 rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow transition-all duration-200 group",
          (onClick || linkTo) && "cursor-pointer hover:shadow-md hover:scale-[1.02]",
          className
        )}
      >
        {icon && (
          <div className="absolute top-4 right-4 text-muted-foreground/50 group-hover:text-primary transition-colors">
            {icon}
          </div>
        )}
        
        <div className="flex flex-col">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          
          {isLoading ? (
            <div className="h-8 w-24 bg-muted rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold mt-1">{value}</p>
          )}
          
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
          
          {trend && (
            <div className="mt-2 flex items-center">
              <span 
                className={cn(
                  "text-xs font-medium mr-2 flex items-center",
                  trend.isUpward ? "text-green-600" : "text-red-600"
                )}
              >
                {trend.isUpward ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12 7a1 1 0 01-1 1H9v9a1 1 0 01-2 0V8H5a1 1 0 01-.707-1.707l3-3a1 1 0 011.414 0l3 3A1 1 0 0112 7z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12 13a1 1 0 01-1 1H9v-9a1 1 0 012 0v9h2a1 1 0 010 2H5a1 1 0 01-.707-1.707l3-3a1 1 0 011.414 0l3 3A1 1 0 0112 13z" clipRule="evenodd" />
                  </svg>
                )}
                {trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">vs last period</span>
            </div>
          )}
        </div>
      </div>
    </CardWrapper>
  );
}
