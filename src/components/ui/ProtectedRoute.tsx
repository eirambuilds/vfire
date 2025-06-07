
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = []
}) => {
  const { user, loading, getProfile } = useAuth();
  const location = useLocation();
  const [profile, setProfile] = React.useState<any>(null);
  const [isCheckingRole, setIsCheckingRole] = React.useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const profileData = await getProfile();
        setProfile(profileData);
      }
      setIsCheckingRole(false);
    };

    if (!loading && user) {
      fetchProfile();
    } else if (!loading) {
      setIsCheckingRole(false);
    }
  }, [user, loading, getProfile]);

  if (loading || isCheckingRole) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    // Redirect to login page if not authenticated
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If roles are specified, check if user has required role
  if (allowedRoles.length > 0 && profile) {
    if (!allowedRoles.includes(profile.role)) {
      // Redirect based on user role
      if (profile.role === 'admin') {
        return <Navigate to="/admin" replace />;
      } else if (profile.role === 'inspector') {
        return <Navigate to="/inspector" replace />;
      } else {
        return <Navigate to="/owner" replace />;
      }
    }
  }

  return <>{children}</>;
};
