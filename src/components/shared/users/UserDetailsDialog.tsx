// src/components/shared/users/UserDetailsDialog.tsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, Mail, Shield, Clock, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  first_name: string;
  middleName?: string;
  last_name: string;
  email: string;
  role: string;
  status: string;
  position?: string;
  created_at?: string;
  availability_start_date?: string;
  availability_end_date?: string;
  phone_number?: string;
}

interface UserDetailsDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserDetailsDialog: React.FC<UserDetailsDialogProps> = ({
  user,
  open,
  onOpenChange,
}) => {
  if (!user) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge
            className="bg-green-100 text-green-800 hover:bg-green-200 transition-colors duration-200"
          >
            Active
          </Badge>
        );
      case 'inactive':
        return (
          <Badge
            className="bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors duration-200"
          >
            Inactive
          </Badge>
        );
      default:
        return (
          <Badge
            className="bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors duration-200"
          >
            {status || 'N/A'}
          </Badge>
        );
    }
  };

  const formatAvailability = (start?: string, end?: string) => {
    if (!start && !end) return 'N/A';
    try {
      const startDate = start ? new Date(start).toLocaleDateString() : 'N/A';
      const endDate = end ? new Date(end).toLocaleDateString() : 'N/A';
      return `${startDate} - ${endDate}`;
    } catch (error) {
      return 'Invalid date';
    }
  };

  const capitalizeName = (name: string | undefined): string => {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  const isInspector = user.role === 'inspector';
  const isOwnerOrAdmin = user.role === 'owner' || user.role === 'admin';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "sm:max-w-[550px] p-0 border border-orange-200 bg-gradient-to-br from-gray-50 via-white to-gray-100",
          "shadow-lg rounded-lg overflow-hidden animate-in fade-in duration-300"
        )}
      >
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <User className="h-6 w-6 text-orange-600" />
              {capitalizeName(user.first_name)} {capitalizeName(user.last_name)}
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              Complete details for this user
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            {/* Status */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              {getStatusBadge(user.status)}
            </div>

            {/* User ID */}
            <div className="flex items-start gap-3">
              <Hash className="h-4 w-4 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">User ID</p>
                <p className="text-sm text-gray-600">{user.id}</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Email</p>
                <p className="text-sm text-gray-600">{user.email || 'N/A'}</p>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-start gap-3">
              <Shield className="h-4 w-4 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Role</p>
                <p className="text-sm text-gray-600">{user.role || 'N/A'}</p>
              </div>
            </div>

            {/* Position (only for inspector) */}
            {isInspector && (
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Position</p>
                  <p className="text-sm text-gray-600">{user.position || 'N/A'}</p>
                </div>
              </div>
            )}

            {/* Availability (only for inspector) */}
            {!isOwnerOrAdmin && (
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Availability</p>
                  <p className="text-sm text-gray-600">
                    {formatAvailability(user.availability_start_date, user.availability_end_date)}
                  </p>
                </div>
              </div>
            )}

            {/* Date Joined */}
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Date Joined</p>
                <p className="text-sm text-gray-600">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="bg-white border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 transition-all duration-200 shadow-sm"
            >
              Close
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};