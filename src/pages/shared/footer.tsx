import React from 'react';
import { Flame } from 'lucide-react';
import { HomeFooterMobile } from '@/components/layout/HomeFooterMobile';
import { useIsMobile } from '@/hooks/use-mobile';

export const Footer: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <>
      <footer className={`w-full bg-orange-50 border-t border-orange-100 py-6 ${isMobile ? 'pb-20' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <Flame className="w-8 h-8 text-red-500 animate-pulse mr-2" />
            <span className="font-medium">V-FIRE Inspect Management System</span>
          </div>
          <p className="text-sm text-muted-foreground mt-4 md:mt-0">
            © {new Date().getFullYear()} All rights reserved.
          </p>
        </div>
      </footer>
      {isMobile && <HomeFooterMobile />}
    </>
  );
};