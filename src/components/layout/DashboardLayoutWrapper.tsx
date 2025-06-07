
import React from 'react';
import { DashboardLayout } from './DashboardLayout';
import { UserRole } from '@/types/inspection';
import { usePageTransition } from '@/utils/animations';

export interface DashboardLayoutWrapperProps {
  children: React.ReactNode;
  title: string;
  userRole: UserRole;
}

export const DashboardLayoutWrapper: React.FC<DashboardLayoutWrapperProps> = ({
  children,
  title,
  userRole,
}) => {
  const pageTransition = usePageTransition();
  
  return (
    <DashboardLayout title={title} userRole={userRole}>
      <div
        style={pageTransition.animate}
        className="min-h-[calc(100vh-4rem)] transition-all duration-300"
      >
        {children}
      </div>
    </DashboardLayout>
  );
};
