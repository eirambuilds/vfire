
import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Info, HelpCircle, PhoneCall } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useLocation } from 'react-router-dom';

export function HomeFooterMobile() {
  const { pathname } = useLocation();
  
  const navItems = [
    { title: "Home", path: "/", icon: <Home className="h-5 w-5" /> },
    { title: "About", path: "/about", icon: <Info className="h-5 w-5" /> },
    { title: "FAQs", path: "/faqs", icon: <HelpCircle className="h-5 w-5" /> },
    { title: "Contact", path: "/contact", icon: <PhoneCall className="h-5 w-5" /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 md:hidden z-40">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full pt-1",
              pathname === item.path 
                ? "text-orange-600" 
                : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            )}
          >
            {item.icon}
            <span className="text-xs mt-1">{item.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
