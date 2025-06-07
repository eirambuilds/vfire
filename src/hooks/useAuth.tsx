
import { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, InspectorDutyStatus } from '@/types/inspection';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string, role: UserRole) => Promise<void>;
  signUp: (userData: any) => Promise<void>;
  signUpEstablishmentOwner: (userData: any) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // For mock purposes, we'll check localStorage
        const storedUser = localStorage.getItem('fireInspectionUser');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string, role: UserRole) => {
    setLoading(true);
    setError(null);
    try {
      // Mock login for development
      const mockUser: User = {
          id: '123',
          email: email,
          firstName: role === 'admin' ? 'Admin' : role === 'inspector' ? 'Inspector' : 'Owner',
          lastName: 'User',
          role: role,
          status: 'active',
          created_at: new Date().toISOString(),
          availabilityEndDate: '',
          availabilityStartDate: undefined,
          dutyStatus: role === 'inspector' ? 'off_duty' as InspectorDutyStatus : undefined
      };
      
      // Store in localStorage for session persistence
      localStorage.setItem('fireInspectionUser', JSON.stringify(mockUser));
      setUser(mockUser);
    } catch (error: any) {
      setError(error.message || 'Failed to sign in');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign up function
  const signUp = async (userData: any) => {
    setLoading(true);
    setError(null);
    try {
      // Mock sign up
      console.log('Sign up:', userData);
      // In a real app, you would call your API here
    } catch (error: any) {
      setError(error.message || 'Failed to sign up');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign up establishment owner function
  const signUpEstablishmentOwner = async (userData: any) => {
    setLoading(true);
    setError(null);
    try {
      // Mock sign up for establishment owner
      console.log('Sign up establishment owner:', userData);
      // In a real app, you would register the user and their establishments
    } catch (error: any) {
      setError(error.message || 'Failed to sign up');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    setLoading(true);
    try {
      // For mock, just remove from localStorage
      localStorage.removeItem('fireInspectionUser');
      setUser(null);
    } catch (error: any) {
      setError(error.message || 'Failed to sign out');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      // Mock password reset
      console.log('Reset password for:', email);
    } catch (error: any) {
      setError(error.message || 'Failed to reset password');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update user function
  const updateUser = async (userData: Partial<User>) => {
    setLoading(true);
    setError(null);
    try {
      // Mock user update
      if (user) {
        const updatedUser = { ...user, ...userData };
        localStorage.setItem('fireInspectionUser', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to update user');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signUpEstablishmentOwner,
    signOut,
    resetPassword,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
