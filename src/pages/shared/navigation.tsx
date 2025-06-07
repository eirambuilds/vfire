import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavigationProps {
  activePage?: 'home' | 'about' | 'faqs' | 'contact';
}

export const Navigation: React.FC<NavigationProps> = ({ activePage }) => {
  const location = useLocation();

  return (
    <nav className="w-full bg-white/80 backdrop-blur-sm sticky top-0 z-10 border-b border-orange-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <Flame className="w-8 h-8 text-red-500 animate-pulse mr-2" />
              <span className="font-semibold text-xl tracking-tight">V-FIRE Inspect</span>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activePage === 'home' || location.pathname === '/'
                    ? 'text-orange-600'
                    : 'text-gray-700 hover:text-orange-600'
                }`}
              >
                Home
              </Link>
              <Link
                to="/about"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activePage === 'about' || location.pathname === '/about'
                    ? 'text-orange-600'
                    : 'text-gray-700 hover:text-orange-600'
                }`}
              >
                About
              </Link>
              <Link
                to="/faqs"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activePage === 'faqs' || location.pathname === '/faqs'
                    ? 'text-orange-600'
                    : 'text-gray-700 hover:text-orange-600'
                }`}
              >
                FAQs
              </Link>
              <Link
                to="/contact"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activePage === 'contact' || location.pathname === '/contact'
                    ? 'text-orange-600'
                    : 'text-gray-700 hover:text-orange-600'
                }`}
              >
                Contact
              </Link>
            </div>
          </div>
          <div className="flex space-x-2">
            <Link to="/owner-login">
              <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-100">
                Login
              </Button>
            </Link>
            <Link to="/owner-signup">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white">Sign Up</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};