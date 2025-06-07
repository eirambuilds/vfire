import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayoutWrapper } from '@/components/layout/DashboardLayoutWrapper';
import { useAuth, User } from '@/contexts/AuthContext';
import { FadeInSection } from '@/components/ui/animations/FadeInSection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User as UserIcon, Calendar, AlertTriangle, Eye, EyeOff, Phone, Shield, CheckCircle2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

// Extend User interface to include additional fields
interface ExtendedUser extends User {
  phone_number?: string | null;
  status: 'active' | 'inactive';
}

const ProfilePage: React.FC = () => {
  const { user: authUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [initialUserData, setInitialUserData] = useState(userData); // Store initial data
  const [errors, setErrors] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [successDialog, setSuccessDialog] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  useEffect(() => {
    if (authUser) {
      const initialData = {
        first_name: authUser.first_name || '',
        middle_name: authUser.middle_name || '',
        last_name: authUser.last_name || '',
        email: authUser.email || '',
        phone_number: (authUser as ExtendedUser).phone_number || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      };
      setUserData(initialData);
      setInitialUserData(initialData); // Set initial data for comparison
    } else {
      navigate('/');
    }
  }, [authUser, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // Check if user data has changed
  const hasChanges = () => {
    return (
      userData.first_name !== initialUserData.first_name ||
      userData.middle_name !== initialUserData.middle_name ||
      userData.last_name !== initialUserData.last_name ||
      userData.email !== initialUserData.email ||
      userData.phone_number !== initialUserData.phone_number
    );
  };

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let hasErrors = false;
    const newErrors = { ...errors };

    if (!userData.first_name) {
      newErrors.first_name = 'First Name is required';
      hasErrors = true;
    }
    if (!userData.last_name) {
      newErrors.last_name = 'Last Name is required';
      hasErrors = true;
    }
    if (!userData.email) {
      newErrors.email = 'Email is required';
      hasErrors = true;
    }
    if (userData.phone_number && !/^09\d{9}$/.test(userData.phone_number)) {
      newErrors.phone_number = 'Phone number must be exactly 11 digits starting with 09';
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    try {
      const updatedData: Partial<ExtendedUser> = {
        first_name: userData.first_name,
        middle_name: userData.middle_name === '' ? null : userData.middle_name,
        last_name: userData.last_name,
        email: userData.email,
        phone_number: userData.phone_number === '' ? null : userData.phone_number,
      };

      console.log('Updated Data to be sent:', updatedData);

      // Update AuthContext user
      await updateUser(updatedData);
      console.log('updateUser called successfully');

      // Update Supabase auth email if changed
      if (authUser.email !== userData.email) {
        const { error: authError } = await supabase.auth.updateUser({ email: userData.email });
        if (authError) throw authError;
        console.log('Supabase auth email updated');
      }

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: updatedData.first_name,
          middle_name: updatedData.middle_name,
          last_name: updatedData.last_name,
          phone_number: updatedData.phone_number,
        })
        .eq('id', authUser.id);

      if (profileError) throw profileError;
      console.log('Profiles table updated successfully');

      setInitialUserData(userData); // Update initial data after successful save
      setIsEditing(false);
      setSuccessDialog({ open: true, message: 'Profile updated successfully!' });
    } catch (error: any) {
      console.error('Profile update error:', error);
      setErrors((prev) => ({
        ...prev,
        email: error.message || 'Failed to update profile',
      }));
    }
  };

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let hasErrors = false;
    const newErrors = { ...errors };

    if (!userData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
      hasErrors = true;
    }
    if (!userData.newPassword) {
      newErrors.newPassword = 'New password is required';
      hasErrors = true;
    } else if (userData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
      hasErrors = true;
    }
    if (!userData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required';
      hasErrors = true;
    }
    if (userData.newPassword !== userData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    try {
      if (authUser?.email) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: authUser.email,
          password: userData.currentPassword,
        });
        if (signInError) {
          setErrors((prev) => ({
            ...prev,
            currentPassword: 'Current password is incorrect',
          }));
          return;
        }
      }

      const { error } = await supabase.auth.updateUser({ password: userData.newPassword });
      if (error) throw error;

      setSuccessDialog({ open: true, message: 'Password changed successfully! Logging you out...' });
      setUserData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      setErrors({ ...errors, currentPassword: '', newPassword: '', confirmPassword: '' });

      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/');
      }, 2000);
    } catch (error: any) {
      console.error('Password change error:', error);
      setErrors((prev) => ({
        ...prev,
        newPassword: error.message || 'Failed to change password',
      }));
    }
  };

  const isPasswordFormValid = () =>
    userData.currentPassword.length > 0 &&
    userData.newPassword.length >= 6 &&
    userData.confirmPassword.length > 0 &&
    userData.newPassword === userData.confirmPassword &&
    !errors.currentPassword &&
    !errors.newPassword &&
    !errors.confirmPassword;

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Not available';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const closeSuccessDialog = () => {
    setSuccessDialog({ ...successDialog, open: false });
    // Auto-refresh the page after dialog closes (except for password change, which logs out)
    if (!successDialog.message.includes('Logging you out')) {
      window.location.reload();
    }
  };

  if (!authUser) return null;

  const extendedUser = authUser as ExtendedUser;

  return (
    <DashboardLayoutWrapper title="Profile" userRole={authUser.role}>
      <div className="max-w-3xl mx-auto space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">Profile Settings</h1>
          </div>
          <p className="text-sm text-muted-foreground">Manage your account details</p>
        </div>

        <FadeInSection delay={100}>
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full max-w-xs grid-cols-2 mb-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card className="border border-border/40 bg-card/95 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Profile Information</CardTitle>
                  <CardDescription className="text-sm">
                    Update your personal details below
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor="first_name" className="text-sm">
                          First Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="first_name"
                          name="first_name"
                          value={userData.first_name}
                          onChange={handleChange}
                          disabled={!isEditing}
                          required
                          className="max-w-[280px]"
                        />
                        {errors.first_name && (
                          <p className="text-red-500 text-xs">{errors.first_name}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="last_name" className="text-sm">
                          Last Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="last_name"
                          name="last_name"
                          value={userData.last_name}
                          onChange={handleChange}
                          disabled={!isEditing}
                          required
                          className="max-w-[280px]"
                        />
                        {errors.last_name && (
                          <p className="text-red-500 text-xs">{errors.last_name}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="email" className="text-sm">
                          Email Address <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={userData.email}
                          onChange={handleChange}
                          disabled={!isEditing}
                          required
                          className="max-w-[280px]"
                        />
                        {errors.email && (
                          <p className="text-red-500 text-xs">{errors.email}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="phone_number" className="text-sm">
                          Phone Number
                        </Label>
                        <Input
                          id="phone_number"
                          name="phone_number"
                          value={userData.phone_number}
                          onChange={handleChange}
                          disabled={!isEditing}
                          placeholder="09123456789"
                          className="max-w-[280px]"
                          maxLength={11}
                        />
                        {errors.phone_number && (
                          <p className="text-red-500 text-xs">{errors.phone_number}</p>
                        )}
                      </div>
                    </div>

                    <Separator className="my-2" />

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Role</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {extendedUser.role === "owner" ? "Establishment Owner" : extendedUser.role}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Member Since</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(extendedUser.created_at)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Account Status</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {extendedUser.status}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsEditing(false);
                              setUserData(initialUserData); // Reset to initial data on cancel
                            }}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" size="sm" disabled={!hasChanges()}>
                            Save Changes
                          </Button>
                        </div>
                      ) : (
                        <Button type="button" size="sm" onClick={() => setIsEditing(true)}>
                          Edit Profile
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="password">
              <Card className="border border-border/40 bg-card/95 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Change Password</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Ensure your account's security by updating your password regularly.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 p-2 mb-3 bg-yellow-100 border border-yellow-400 rounded-md">
                    <AlertTriangle className="h-4 w-4 text-yellow-700" />
                    <p className="text-yellow-700 text-s">
                      Changing your password will log you out.
                    </p>
                  </div>
                  <form onSubmit={handlePasswordChange} className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="currentPassword" className="text-sm">
                        Current Password <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative max-w-s">
                        <Input
                          id="currentPassword"
                          name="currentPassword"
                          type={showPasswords.currentPassword ? 'text' : 'password'}
                          value={userData.currentPassword}
                          onChange={handleChange}
                          required
                          className="pr-10"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => togglePasswordVisibility('currentPassword')}
                        >
                          {showPasswords.currentPassword ? (
                            <Eye className="h-4 w-4 text-gray-500" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          )}
                        </button>
                      </div>
                      {errors.currentPassword && (
                        <p className="text-red-500 text-xs">{errors.currentPassword}</p>
                      )}
                    </div>

                    <Separator className="my-2" />

                    <div className="space-y-1">
                      <Label htmlFor="newPassword" className="text-sm">
                        New Password <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative max-w-s">
                        <Input
                          id="newPassword"
                          name="newPassword"
                          type={showPasswords.newPassword ? 'text' : 'password'}
                          value={userData.newPassword}
                          onChange={handleChange}
                          required
                          className="pr-10"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => togglePasswordVisibility('newPassword')}
                        >
                          {showPasswords.newPassword ? (
                            <Eye className="h-4 w-4 text-gray-500" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          )}
                        </button>
                      </div>
                      <p className="text-gray-500 text-xs">Minimum 6 characters</p>
                      {errors.newPassword && (
                        <p className="text-red-500 text-xs">{errors.newPassword}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="confirmPassword" className="text-sm">
                        Confirm New Password <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative max-w-s">
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showPasswords.confirmPassword ? 'text' : 'password'}
                          value={userData.confirmPassword}
                          onChange={handleChange}
                          required
                          className="pr-10"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => togglePasswordVisibility('confirmPassword')}
                        >
                          {showPasswords.confirmPassword ? (
                            <Eye className="h-4 w-4 text-gray-500" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          )}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-red-500 text-xs">{errors.confirmPassword}</p>
                      )}
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button type="submit" size="sm" disabled={!isPasswordFormValid()}>
                        Change Password
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </FadeInSection>
      

        <Dialog open={successDialog.open} onOpenChange={closeSuccessDialog}>
        <DialogContent className="sm:max-w-[425px] p-6 bg-white/80 backdrop-blur-md border border-neutral-200/50 shadow-lg rounded-xl">       
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              Success
            </DialogTitle>
            <DialogDescription className="text-neutral-600">
              {successDialog.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={closeSuccessDialog}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Got It
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </div>
    </DashboardLayoutWrapper>
  );
};

export default ProfilePage;