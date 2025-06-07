import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

// Define the extended User type with profile data
export interface User {
  id: string;
  email: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  role: 'admin' | 'inspector' | 'owner';
  created_at: string;
  phone_number?: string;
  status: 'active' | 'inactive';
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string, role: string) => Promise<void>;
  signUp: (email: string, password: string, formData: any) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  getProfile: () => Promise<User | null>;
  updateUser: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async (session: Session | null) => {
      if (session?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name, role, created_at, phone_number, status')
          .eq('id', session.user.id)
          .single();

        if (profileError || !profile) {
          console.error('Error fetching profile:', profileError?.message || 'Profile not found');
          setError(profileError?.message || 'Profile not found');
          setUser(null);
        } else {
          setUser({
            id: profile.id,
            email: profile.email,
            first_name: profile.first_name as string,
            middle_name: '',
            last_name: profile.last_name as string,
            role: profile.role as 'admin' | 'inspector' | 'owner',
            created_at: profile.created_at as string,
            phone_number: profile.phone_number ?? '',
            status: profile.status as 'active' | 'inactive',
          });
          setError(null);
        }
      } else {
        setUser(null);
      }
      setSession(session);
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchUserData(session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchUserData(session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string, role: string) => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw new Error(authError.message);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('status, role')
        .eq('id', data.user.id)
        .single();
      if (profileError) throw new Error('Failed to fetch user profile');

      if (profile.status === 'inactive') {
        await supabase.auth.signOut();
        throw new Error('Your account is inactive. Please contact an administrator.');
      }

      if (profile.role !== role) {
        await supabase.auth.signOut();
        throw new Error('Role mismatch. Please use the correct login page.');
      }

      if (role === 'admin') navigate('/admin');
      else if (role === 'inspector') navigate('/inspector');
      else navigate('/owner');
    } catch (error: any) {
      console.error('Sign in error:', error.message);
      setError(error.message || 'An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, formData: any): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      // Check for duplicate establishments
      for (const est of formData.establishments) {
        const { data: existingEst, error: checkError } = await supabase
          .from('establishments')
          .select('id')
          .or(`name.eq.${est.name},dti_number.eq.${est.dtiCertificateNo}`)
          .limit(1);
        if (checkError) {
          throw new Error(`Error checking establishment: ${checkError.message}`);
        }
        if (existingEst?.length) {
          throw new Error(`Establishment "${est.name}" or DTI Number "${est.dtiCertificateNo}" already exists`);
        }
      }

      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: formData.firstName,
            middle_name: formData.middleName,
            last_name: formData.lastName,
            role: 'owner',
          },
        },
      });
      if (authError) {
        throw new Error(authError.message);
      }

      if (authData.user) {
        const userId = authData.user.id;
        // Insert profile
        const { error: profileError } = await supabase.from('profiles').insert({
          id: userId,
          first_name: formData.firstName,
          middle_name: formData.middleName || '',
          last_name: formData.lastName,
          email,
          role: 'owner',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          phone_number: formData.phoneNumber || '',
        });
        if (profileError) {
          throw new Error(`Failed to create user profile: ${profileError.message}`);
        }

        // Insert establishments
        const establishmentInserts = formData.establishments.map((est: any) => ({
          name: est.name,
          dti_number: est.dtiCertificateNo,
          owner_id: userId,
          status: 'unregistered',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          address: '',
          type: '',
        }));
        const { error: estError } = await supabase.from('establishments').insert(establishmentInserts);
        if (estError) {
          throw new Error(`Failed to create establishments: ${estError.message}`);
        }

        // Sign out to require email verification
        await supabase.auth.signOut();
        return { success: true };
      } else {
        throw new Error('User creation failed: No user data returned');
      }
    } catch (error: any) {
      console.error('Sign up error:', error.message);
      setError(error.message || 'An error occurred during sign up');
      // Clean up user if created
      if ((await supabase.auth.getUser()).data.user) {
        await supabase.auth.admin.deleteUser((await supabase.auth.getUser()).data.user!.id);
      }
      return { success: false, error: error.message || 'An error occurred during sign up' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      await supabase.auth.signOut();
      navigate('/');
    } catch (error: any) {
      console.error('Sign out error:', error.message);
      setError(error.message || 'An error occurred during sign out');
    } finally {
      setLoading(false);
    }
  };

  const getProfile = async () => {
    try {
      setError(null);
      if (!user) throw new Error('No user');
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, middle_name, last_name, role, created_at, phone_number, status')
        .eq('id', user.id)
        .single();
      if (error) throw new Error(error.message);
      return data as unknown as User;
    } catch (error: any) {
      console.error('Error fetching profile:', error.message);
      setError(error.message || 'Failed to fetch profile');
      return null;
    }
  };

  const updateUser = async (data: Partial<User>) => {
    try {
      setError(null);
      if (!user) throw new Error('No user to update');
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: data.first_name,
          middle_name: data.middle_name ?? user.middle_name ?? '',
          last_name: data.last_name,
          email: data.email,
          phone_number: data.phone_number ?? user.phone_number ?? '',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      if (error) throw new Error(error.message);

      setUser((prev) =>
        prev
          ? {
              ...prev,
              first_name: data.first_name ?? prev.first_name,
              middle_name: data.middle_name ?? prev.middle_name ?? '',
              last_name: data.last_name ?? prev.last_name,
              email: data.email ?? prev.email,
              phone_number: data.phone_number ?? prev.phone_number ?? '',
            }
          : null
      );
    } catch (error: any) {
      console.error('Error updating user:', error.message);
      setError(error.message || 'Failed to update user');
      throw error;
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, error, signIn, signUp, signOut, getProfile, updateUser, clearError }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};