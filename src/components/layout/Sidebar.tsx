
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Building, 
  FileText, 
  BarChart2, 
  Calendar, 
  MapPin, 
  Menu, 
  X, 
  ClipboardList,
  Users,
  LogOut,
  Flame,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { LogoutConfirmationDialog } from '@/components/ui/dialogs/LogoutConfirmationDialog';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  userRole: 'owner' | 'inspector' | 'admin';
}

interface NavItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

export function Sidebar({ userRole }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const { pathname } = useLocation();
  const { toast } = useToast();
  const { signOut } = useAuth();

  const ownerNavItems: NavItem[] = [
    { title: "Dashboard", path: "/owner", icon: <LayoutDashboard className="h-5 w-5" /> },
    { title: "Establishments", path: "/owner/establishments", icon: <Building className="h-5 w-5" /> },
    { title: "Applications", path: "/owner/applications", icon: <FileText className="h-5 w-5" /> },
    { title: "Inspections", path: "/owner/inspections", icon: <ClipboardList className="h-5 w-5" /> },
    // { title: "Analytics", path: "/owner/analytics", icon: <BarChart2 className="h-5 w-5" /> },
    { title: "Calendar", path: "/owner/calendar", icon: <Calendar className="h-5 w-5" /> },
    { title: "Map", path: "/owner/map", icon: <MapPin className="h-5 w-5" /> },
  ];

  const inspectorNavItems: NavItem[] = [
    { title: "Dashboard", path: "/inspector", icon: <LayoutDashboard className="h-5 w-5" /> },
    { title: "Inspections", path: "/inspector/inspections", icon: <ClipboardList className="h-5 w-5" /> },
    // { title: "Analytics", path: "/inspector/analytics", icon: <BarChart2 className="h-5 w-5" /> },
    { title: "Calendar", path: "/inspector/calendar", icon: <Calendar className="h-5 w-5" /> },
    { title: "Map", path: "/inspector/map", icon: <MapPin className="h-5 w-5" /> },
  ];

  const adminNavItems: NavItem[] = [
    { title: "Dashboard", path: "/admin", icon: <LayoutDashboard className="h-5 w-5" /> },
    // { title: "Analytics", path: "/admin/analytics", icon: <BarChart2 className="h-5 w-5" /> },
    { title: "Users", path: "/admin/users", icon: <Users className="h-5 w-5" /> },
    { title: "Establishments", path: "/admin/establishments", icon: <Building className="h-5 w-5" /> },
    { title: "Applications", path: "/admin/applications", icon: <FileText className="h-5 w-5" /> },
    { title: "Inspections", path: "/admin/inspections", icon: <ClipboardList className="h-5 w-5" /> },
    { title: "Calendar", path: "/admin/calendar", icon: <Calendar className="h-5 w-5" /> },
    { title: "Map", path: "/admin/map", icon: <MapPin className="h-5 w-5" /> },
  ];

  const navItems = userRole === 'owner' 
    ? ownerNavItems 
    : userRole === 'inspector' 
      ? inspectorNavItems 
      : adminNavItems;
      
  const handleLogout = () => {
    setShowLogoutConfirmation(true);
  };
  
  const confirmLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: "destructive",
        title: "Logout Error",
        description: "There was an issue signing out. Please try again.",
      });
    }
  };

  return (
    <>
      <div 
        className={cn(
          "flex flex-col h-screen bg-sidebar sticky top-0 transition-all duration-300 border-r border-sidebar-border",
          collapsed ? "w-[70px]" : "w-[250px]"
        )}
      >
        <div className="flex items-center justify-between p-4 h-16">
          {!collapsed && (
            <div
              className="flex items-center space-x-2 font-semibold text-lg tracking-tight"
            >
              <Flame className="w-8 h-8 text-red-600" />
              <span className="text-red-600">V-FIRE 
              <span className="text-black text-sm"> Inspect</span></span>
            </div>
          )}

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setCollapsed(!collapsed)}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {collapsed ? <Menu className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
          </Button>
        </div>
        
        <Separator className="bg-sidebar-border" />
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "navigation-item group transition-all",
                  collapsed ? "flex justify-center" : "px-4", // Center when collapsed
                  pathname === item.path ? "navigation-item-active" : "navigation-item-inactive"
                )}
                title={collapsed ? item.title : undefined}
              >
                <span className="relative">
                  {item.icon}
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </span>
                {!collapsed && <span>{item.title}</span>}
              </Link>
            ))}
          </nav>
        </div>
        
        {/* <Separator className="bg-sidebar-border" /> */}
        
        {/* <div className="p-4">
          <Button 
            variant="ghost"
            className={cn(
              "navigation-item navigation-item-inactive",
              "flex w-full justify-center"
            )}
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div> */}
      </div>
      
      {/* Logout Confirmation Dialog */}
      <LogoutConfirmationDialog
        open={showLogoutConfirmation}
        onOpenChange={setShowLogoutConfirmation}
        onConfirm={confirmLogout}
      />
    </>
  );
}
