
import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { cn } from "@/lib/utils";
import { FadeInSection } from '../ui/animations/FadeInSection';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { NotificationSidebar } from './NotificationSidebar';
import { UserProfileMenu } from '../ui/UserProfileMenu';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  userRole: 'owner' | 'inspector' | 'admin';
}

export function DashboardLayout({ children, title, userRole }: DashboardLayoutProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - hidden on mobile, shown on larger screens */}
      <div className="hidden md:block">
        <Sidebar userRole={userRole} />
      </div>
      
      {/* Mobile sidebar overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden" onClick={() => setShowMobileMenu(false)}>
          <div className="relative h-full w-[250px]" onClick={e => e.stopPropagation()}>
            <Sidebar userRole={userRole} />
          </div>
        </div>
      )}
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile top bar */}
        <div className="md:hidden h-16 border-b border-border flex items-center justify-between px-4 bg-background/80 backdrop-blur-sm sticky top-0 z-30">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden" 
            onClick={() => setShowMobileMenu(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          {/* Centered Title */}
          <h1 className="text-xl font-semibold">
            {title}
          </h1>
          
          {/* Mobile Actions */}
          <div className="flex items-center gap-2">
            <NotificationSidebar userRole={userRole} />
            <UserProfileMenu />
          </div>
        </div>
        
        {/* Main content with padding - adjusted for mobile */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 md:pt-6 pb-6">
          <FadeInSection className="w-full">
            {children}
          </FadeInSection>
        </main>
      </div>

      {/* Desktop Actions (fixed position) */}
      <div className="fixed top-4 right-4 hidden md:flex items-center gap-2 z-10">
        <NotificationSidebar userRole={userRole} />
        <UserProfileMenu />
      </div>
    </div>
  );
}
