import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserCog, LogOut, X } from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AuthContextType, useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AuthUser {
  id: string;
  email: string;
  first_name?: string;
  middle_name?: string | null;
  last_name?: string;
  role: 'admin' | 'inspector' | 'owner';
}

export function UserProfileMenu() {
  const { user, signOut } = useAuth() as AuthContextType;
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false); // State for confirmation dialog

  console.log('User object from AuthContext:', user);

  const handleLogoutConfirm = async () => {
    try {
      await signOut();
      window.location.href = '/'; // Ensure the page reloads to clear any session data
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log out. Please try again.",
      });
    } finally {
      setIsLogoutDialogOpen(false); // Close dialog regardless of outcome
    }
  };

  const handleLogout = () => {
    setIsLogoutDialogOpen(true); // Open confirmation dialog
  };

  const handleViewProfile = () => {
    if (!user) return;
    navigate('/profile');
  };

  const getInitials = (): string => {
    if (!user) return "U";
    const initials = `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`.toUpperCase();
    return initials || "U";
  };

  const getFullName = (): string => {
    if (!user) return "Guest";
    const parts = [
      user.first_name,
      user.middle_name,
      user.last_name
    ].filter(Boolean);
    return parts.join(' ') || "Unnamed User";
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full" size="icon">
            <Avatar className="h-9 w-9 border-2 border-primary/10">
              <AvatarFallback className="bg-primary/5 text-primary">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium capitalize">
                {getFullName()}
              </p>
              {/* <p className="text-xs text-muted-foreground capitalize">
                {user?.role || 'No role assigned'}
              </p> */}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleViewProfile}
            className="cursor-pointer"
          >
            <UserCog className="mr-2 h-4 w-4" />
            <span>Profile Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Logout Confirmation Dialog */}
      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="sm:max-w-[425px] p-6 bg-white/80 backdrop-blur-md border border-neutral-200/50 shadow-lg rounded-xl">       
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-orange-500" />
              Confirm Logout
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to log out of your account? Any unsaved changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-orange-200 text-orange-700 hover:bg-orange-100 hover:text-orange-800"
              onClick={() => setIsLogoutDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogoutConfirm}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}