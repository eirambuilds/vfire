import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FadeInSection } from '@/components/ui/animations/FadeInSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { SearchIcon, UserPlus, Calendar, Eye, EyeOff, SwitchCamera, Shield, Download, UserIcon } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

// --- User Interface ---
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
  phone_number?: string;
}

// --- NewUser Interface for User Creation ---
interface NewUser extends User {
  password: string;
}

// --- UserFilters Component ---
interface UserFiltersProps {
  searchTerm: string;
  filterRole: string;
  filterStatus: string;
  joinedStartDate: Date | null;
  joinedEndDate: Date | null;
  onSearchChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onJoinedStartChange: (date: Date | null) => void;
  onJoinedEndChange: (date: Date | null) => void;
  onAddUserClick: () => void;
  onExport: () => void;
}

const UserFilters: React.FC<UserFiltersProps> = ({
  searchTerm,
  filterRole,
  filterStatus,
  joinedStartDate,
  joinedEndDate,
  onSearchChange,
  onRoleChange,
  onStatusChange,
  onJoinedStartChange,
  onJoinedEndChange,
  onAddUserClick,
  onExport,
}) => {
  const fieldStyles = "w-full rounded-lg border border-gray-300 focus:border-black transition-all h-10";

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-5 items-center">
      <div className="col-span-1">
        <Select value={filterRole} onValueChange={onRoleChange}>
          <SelectTrigger className={`${fieldStyles}`}>
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All User Roles</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="inspector">Inspector</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-1">
        <Select value={filterStatus} onValueChange={onStatusChange}>
          <SelectTrigger className={`${fieldStyles}`}>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Account Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="relative col-span-2">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
        <Input 
          placeholder="Search users..." 
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`${fieldStyles} pl-10`}
        />
      </div>
      <div className="col-span-1 flex gap-2">
        <Button 
          size="sm" 
        className="w-full flex items-center gap-2 text-white rounded-lg"
          onClick={onAddUserClick}
        >
          <UserPlus className="h-4 w-4" />
          <span>Add User</span>
        </Button>
        <Button
          size="sm"
          onClick={onExport}
        className="w-full flex items-center gap-2 text-white rounded-lg"
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  );
};

// --- UserFormModal Component ---
interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

const inspectorPositions = [
  'FO1', 'FO2', 'FO3',
  'SFO1', 'SFO2', 'SFO3', 'SFO4',
  'FI', 'FSI', 'FCI',
];

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onUserAdded }) => {
  const navigate = useNavigate(); // Initialize useNavigate
  const [newUser, setNewUser] = useState<NewUser>({
    id: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'inspector',
    status: 'active',
    position: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    position: '',
    general: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const validateForm = async () => {
    setFormErrors({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      position: '',
      general: '',
    });

    let hasErrors = false;
    const newErrors = { ...formErrors };

    if (!newUser.first_name) {
      newErrors.first_name = 'First name is required';
      hasErrors = true;
    }
    if (!newUser.last_name) {
      newErrors.last_name = 'Last name is required';
      hasErrors = true;
    }
    if (!newUser.email) {
      newErrors.email = 'Email is required';
      hasErrors = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      newErrors.email = 'Invalid email format';
      hasErrors = true;
    }
    if (!newUser.password) {
      newErrors.password = 'Password is required';
      hasErrors = true;
    } else if (newUser.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      hasErrors = true;
    }
    if (newUser.role === 'inspector' && !newUser.position) {
      newErrors.position = 'Position is required for inspectors';
      hasErrors = true;
    }

    // Check for existing email
    if (newUser.email) {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', newUser.email)
        .single();
      if (existingUser) {
        newErrors.email = 'This email is already registered';
        hasErrors = true;
      }
    }

    if (hasErrors) {
      setFormErrors(newErrors);
      return false;
    }
    return true;
  };

  const handleAddUser = async () => {
    if (!await validateForm()) return;

    setIsLoading(true);
    try {
      // Store the current session
      const { data: sessionData } = await supabase.auth.getSession();
      const currentSession = sessionData.session;

      if (!currentSession) {
        setFormErrors({ ...formErrors, general: 'No active session found. Please log in again.' });
        toast({
          variant: "destructive",
          title: "Error",
          description: "No active session found. Please log in again.",
        });
        return;
      }

      const currentToken = currentSession.access_token;

      // Create a new user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            role: newUser.role,
            position: newUser.role === 'inspector' ? newUser.position : null,
          },
          emailRedirectTo: window.location.origin + '/admin/users', // Update redirect URL
        },
      });

      if (authError) {
        if (authError.message.includes('User already registered')) {
          setFormErrors({ ...formErrors, email: 'This email is already registered' });
          toast({
            variant: "destructive",
            title: "Error",
            description: "This email is already registered.",
          });
          return;
        }
        throw authError;
      }

      // Restore the previous session
      await supabase.auth.setSession({
        access_token: currentToken,
        refresh_token: currentSession.refresh_token,
      });

      // Create the profile
      if (authData?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: authData.user.id,
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            email: newUser.email,
            role: newUser.role as 'admin' | 'inspector' | 'owner',
            status: 'active',
            position: newUser.role === 'inspector' ? newUser.position : null,
            created_at: new Date().toISOString(),
            phone_number: '',
          }]);

        if (profileError) throw profileError;
      }

      // Reset form
      setNewUser({
        id: '',
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        role: 'inspector',
        status: 'active',
        position: '',
      });
      setShowPassword(false);
      toast({
        title: "Success",
        description: "User added successfully.",
      });
      onUserAdded();
      onClose();
      navigate('/admin/users'); // Redirect to /admin/users
    } catch (error) {
      console.error('Error adding user:', error);
      setFormErrors({ ...formErrors, general: error.message || 'Failed to add user' });
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add user.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <div className="py-6 px-4">
          {formErrors.general && (
            <p className="text-red-500 text-sm mb-4">{formErrors.general}</p>
          )}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <label htmlFor="firstName" className="text-sm font-medium text-gray-700">First Name</label>
              <Input
                id="firstName"
                placeholder="Enter first name"
                value={newUser.first_name}
                onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-black-500 transition-all"
              />
              {formErrors.first_name && <p className="text-red-500 text-xs">{formErrors.first_name}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="lastName" className="text-sm font-medium text-gray-700">Last Name</label>
              <Input
                id="lastName"
                placeholder="Enter last name"
                value={newUser.last_name}
                onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-black-500 transition-all"
              />
              {formErrors.last_name && <p className="text-red-500 text-xs">{formErrors.last_name}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-black-500 transition-all"
              />
              {formErrors.email && <p className="text-red-500 text-xs">{formErrors.email}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-black-500 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                </button>
              </div>
              {formErrors.password && <p className="text-red-500 text-xs">{formErrors.password}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium text-gray-700">Role</label>
              <Select 
                value={newUser.role} 
                onValueChange={(value) => setNewUser({ ...newUser, role: value, position: value === 'inspector' ? newUser.position : null })}
              >
                <SelectTrigger className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-black-500 transition-all">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inspector">Inspector</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newUser.role === 'inspector' && (
              <div className="space-y-2">
                <label htmlFor="position" className="text-sm font-medium text-gray-700">Position</label>
                <Select 
                  value={newUser.position} 
                  onValueChange={(value) => setNewUser({ ...newUser, position: value })}
                >
                  <SelectTrigger className="w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-black-500 transition-all">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {inspectorPositions.map((position) => (
                      <SelectItem key={position} value={position}>{position}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.position && <p className="text-red-500 text-xs">{formErrors.position}</p>}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleAddUser} disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- UserTable Component ---
interface UserTableProps {
  users: User[];
  loading: boolean;
  error: string | null;
  filterRole: string;
  onViewDetails: (user: User) => void;
  onEditUser: (user: User) => void;
}

const capitalizeName = (name: string | undefined): string => {
  if (!name) return '';
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

const getRoleBadgeStyles = (role: string): string => {
  switch (role) {
    case 'owner': return 'bg-blue-100 text-blue-800';
    case 'inspector': return 'bg-purple-100 text-purple-800';
    case 'admin': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getPositionBadgeStyles = (position: string | undefined): string => {
  if (!position) return 'bg-gray-100 text-gray-800';
  switch (position) {
    case 'FO1': return 'bg-green-100 text-green-800';
    case 'FO2': return 'bg-green-200 text-green-900';
    case 'FO3': return 'bg-green-300 text-green-900';
    case 'SFO1': return 'bg-teal-100 text-teal-800';
    case 'SFO2': return 'bg-teal-200 text-teal-900';
    case 'SFO3': return 'bg-teal-300 text-teal-900';
    case 'SFO4': return 'bg-teal-400 text-teal-900';
    case 'FI': return 'bg-indigo-100 text-indigo-800';
    case 'FSI': return 'bg-indigo-200 text-indigo-900';
    case 'FCI': return 'bg-indigo-300 text-indigo-900';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusBadgeStyles = (status: string): string => {
  switch (status) {
    case 'active': return 'bg-green-400 text-green-800';
    case 'inactive': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const UserTable: React.FC<UserTableProps> = ({ users, loading, error, filterRole, onViewDetails, onEditUser }) => {
  const hidePositionAndAvailability = filterRole === 'owner' || filterRole === 'admin' || (filterRole === 'all' && users.every(user => user.role === 'owner'));

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date Joined</TableHead>
            <TableHead>Full Name</TableHead>
            <TableHead>Email Address</TableHead>
            <TableHead>Role</TableHead>
            {!hidePositionAndAvailability && <TableHead>Position</TableHead>}
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={hidePositionAndAvailability ? 6 : 8} className="text-center py-6">Loading...</TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={hidePositionAndAvailability ? 6 : 8} className="text-center py-6 text-red-500">{error}</TableCell>
            </TableRow>
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={hidePositionAndAvailability ? 6 : 8} className="text-center py-6 text-muted-foreground">No users found matching your filters</TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell className="font-medium">
                  {user.first_name || user.last_name 
                    ? `${capitalizeName(user.first_name)} ${capitalizeName(user.last_name)}`.trim() 
                    : 'Unnamed User'}
                </TableCell>
                <TableCell>{user.email || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`capitalize ${getRoleBadgeStyles(user.role)}`}>
                    {user.role || 'N/A'}
                  </Badge>
                </TableCell>
                {!hidePositionAndAvailability && (
                  <TableCell>
                    <Badge variant="outline" className={`capitalize ${getPositionBadgeStyles(user.position)}`}>
                      {user.position || 'N/A'}
                    </Badge>
                  </TableCell>
                )}
                <TableCell>
                  <Badge variant="outline" className={`${getStatusBadgeStyles(user.status)}`}>
                    {user.status || 'N/A'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      title={`Change status to ${user.status === 'active' ? 'inactive' : 'active'}`}
                      onClick={() => onEditUser(user)}
                    >
                      <SwitchCamera className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      title="View Details"
                      onClick={() => onViewDetails(user)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

// --- UserDetailsDialog Component ---
interface UserDetailsDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserDetailsDialog: React.FC<UserDetailsDialogProps> = ({ user, open, onOpenChange }) => {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] md:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Full Name</label>
            <p className="text-gray-900">
              {user.first_name || user.last_name 
                ? `${capitalizeName(user.first_name)} ${capitalizeName(user.last_name)}`.trim() 
                : 'Unnamed User'}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <p className="text-gray-900">{user.email || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Role</label>
            <p className="text-gray-900 capitalize">{user.role || 'N/A'}</p>
          </div>
          {user.role === 'inspector' && (
            <div>
              <label className="text-sm font-medium text-gray-700">Position</label>
              <p className="text-gray-900">{user.position || 'N/A'}</p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-gray-700">Status</label>
            <p className="text-gray-900 capitalize">{user.status || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Date Joined</label>
            <p className="text-gray-900">{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Phone Number</label>
            <p className="text-gray-900">{user.phone_number || 'N/A'}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- AdminUsersManagement Component ---
const AdminUsersManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [availabilityStartDate, setAvailabilityStartDate] = useState<Date | null>(null);
  const [availabilityEndDate, setAvailabilityEndDate] = useState<Date | null>(null);
  const [joinedStartDate, setJoinedStartDate] = useState<Date | null>(null);
  const [joinedEndDate, setJoinedEndDate] = useState<Date | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.message || 'Failed to fetch users');
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch users",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);
      if (profileError) throw profileError;
      const { error: authError } = await supabase.auth.admin.deleteUser(id);
      if (authError) throw authError;
      setUsers(users.filter(user => user.id !== id));
      toast({ title: "Success", description: "User deleted successfully" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete user",
      });
    }
  };

  const handleEditUser = async () => {
    if (!userToEdit) return;
    const newStatus = userToEdit.status === 'active' ? 'inactive' : 'active';
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus, phone_number: '' })
        .eq('id', userToEdit.id);
      if (error) throw error;
      setUsers(users.map(u => u.id === userToEdit.id ? { ...u, status: newStatus } : u));
      toast({ title: "Success", description: `User status updated to ${newStatus}` });
      setIsEditModalOpen(false);
      setUserToEdit(null);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update user status",
      });
    }
  };

  const adjustToUTC = (date: Date | null): Date | null => {
    if (!date) return null;
    const utcDate = new Date(date);
    utcDate.setHours(utcDate.getHours() - 8);
    return utcDate;
  };

  const adjustEndDateToUTC = (date: Date | null): Date | null => {
    if (!date) return null;
    const phEndDate = new Date(date);
    phEndDate.setHours(23, 59, 59, 999);
    phEndDate.setHours(phEndDate.getHours() - 8);
    return phEndDate;
  };

  const filteredUsers = users
    .filter(user => {
      const name = `${user.first_name || ''} ${user.last_name || ''}`.trim().toLowerCase();
      const matchesSearch = name.includes(searchTerm.toLowerCase()) || 
                           (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      const matchesStatus = filterStatus === 'all' || user.status === filterStatus;

      const utcAvailabilityStart = adjustToUTC(availabilityStartDate);
      const utcAvailabilityEnd = adjustEndDateToUTC(availabilityEndDate);
      const utcJoinedStart = adjustToUTC(joinedStartDate);
      const utcJoinedEnd = adjustEndDateToUTC(joinedEndDate);

      const joinedDate = user.created_at ? new Date(user.created_at) : null;
      let matchesJoined = true;
      if (utcJoinedStart || utcJoinedEnd) {
        matchesJoined = joinedDate && 
                        (!utcJoinedStart || joinedDate >= utcJoinedStart) && 
                        (!utcJoinedEnd || joinedDate <= utcJoinedEnd);
      }

      return matchesSearch && matchesRole && matchesStatus && matchesJoined;
    })
    .sort((a, b) => {
      const statusPriority = { active: 1, inactive: 2 };
      return statusPriority[a.status] - statusPriority[b.status];
    });

  const handleExportToExcel = () => {
    const data = filteredUsers.map(user => ({
      'Date Joined': user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A',
      'Full Name': user.first_name || user.last_name 
        ? `${capitalizeName(user.first_name)} ${capitalizeName(user.last_name)}`.trim() 
        : 'Unnamed User',
      'Email Address': user.email || 'N/A',
      'Role': user.role || 'N/A',
      'Position': user.position || 'N/A',
      'Status': user.status || 'N/A',
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
    XLSX.writeFile(workbook, 'users_export.xlsx');
  };

  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <DashboardLayout title="Users Management" userRole="admin">
      <div className="space-y-6 p-1">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">Users Management</h1>
          </div>
          <p className="text-muted-foreground">
            Manage users, their roles, and statuses. You can add new users, edit existing ones, and filter the list based on various criteria.
          </p>
        </div>

        <FadeInSection delay={200}>
          <Card>
            <CardContent>
              <UserFilters
                searchTerm={searchTerm}
                filterRole={filterRole}
                filterStatus={filterStatus}
                joinedStartDate={joinedStartDate}
                joinedEndDate={joinedEndDate}
                onSearchChange={setSearchTerm}
                onRoleChange={setFilterRole}
                onStatusChange={setFilterStatus}
                onJoinedStartChange={setJoinedStartDate}
                onJoinedEndChange={setJoinedEndDate}
                onAddUserClick={() => setIsAddModalOpen(true)}
                onExport={handleExportToExcel}
              />
            </CardContent>
          </Card>
        </FadeInSection>

        <UserFormModal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)} 
          onUserAdded={fetchUsers} 
        />

        <FadeInSection delay={300}>
          <Card>
            <CardContent className="pt-6">
              <UserTable
                users={paginatedUsers}
                loading={loading}
                error={error}
                filterRole={filterRole}
                onViewDetails={(user) => {
                  setSelectedUser(user);
                  setIsDetailsDialogOpen(true);
                }}
                onEditUser={(user) => {
                  setUserToEdit(user);
                  setIsEditModalOpen(true);
                }}
              />
              <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {endIndex} of {totalItems} entries
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="disabled:opacity-50"
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="disabled:opacity-50"
                  >
                  </Button>
                  <span className="text-sm">
                    {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="disabled:opacity-50"
                  >
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="disabled:opacity-50"
                  >
                    Last
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeInSection>
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent 
          className={cn(
            "sm:max-w-md p-0 border border-orange-200 bg-gradient-to-br from-gray-50 via-white to-gray-100",
            "shadow-lg rounded-lg overflow-hidden animate-in fade-in duration-300"
          )}
        >
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Shield className="h-6 w-6 text-orange-600" />
                Confirm Status Change
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {userToEdit && (
                <p className="text-gray-600">
                  Are you sure you want to change{' '}
                  <span className="font-semibold text-orange-600">
                    {userToEdit.first_name || ''} {userToEdit.last_name || ''}
                  </span>
                  ’s status from{' '}
                  <span className="font-semibold">
                    {userToEdit.status}
                  </span>{' '}
                  to{' '}
                  <span className="font-semibold">
                    {userToEdit.status === 'active' ? 'inactive' : 'active'}
                  </span>?
                </p>
              )}
            </div>
            <DialogFooter className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditModalOpen(false);
                  setUserToEdit(null);
                }}
                className="bg-white border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 transition-all duration-200 shadow-sm"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleEditUser}
                className="bg-green-600 text-white font-semibold hover:bg-green-700 transition-all duration-200 shadow-md transform hover:scale-105"
              >
                Confirm
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <UserDetailsDialog
        user={selectedUser}
        open={isDetailsDialogOpen}
        onOpenChange={(open) => {
          setIsDetailsDialogOpen(open);
          if (!open) setSelectedUser(null);
        }}
      />
    </DashboardLayout>
  );
};

export default AdminUsersManagement;