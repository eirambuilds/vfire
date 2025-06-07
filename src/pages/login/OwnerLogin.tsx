import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FadeInSection } from '@/components/ui/animations/FadeInSection';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Building, ArrowLeft, LogIn, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext'; // Adjust path
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

const OwnerLogin = () => {
  const { signIn, loading, user, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  // Check if user came from signup page
  const justSignedUp = location.state?.justSignedUp || false;

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/owner');
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
    clearError(); // Clear error when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError(); // Clear previous errors before signing in
    await signIn(formData.email, formData.password, 'owner');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-orange-50 to-red-50">
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Link>

      <FadeInSection>
        <Card className="w-full max-w-md glass-card border border-orange-200 shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center">
              <Building className="h-10 w-10 text-orange-500" />
            </div>
            <CardTitle className="text-2xl font-bold">Login</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>

          <CardContent>
            {justSignedUp && (
              <Alert className="mb-4 bg-green-50 border-green-100">
                <AlertDescription className="text-green-700">
                  Account created successfully! Please check your email to verify your account, then log in.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="mb-4 bg-red-50 border-red-100">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    placeholder="owner@example.com"
                    required
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="bg-background/50"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link to="#" className="text-sm text-orange-600 hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      className="bg-background/50 pr-10"
                      disabled={loading}
                      placeholder="••••••••"

                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                      onClick={togglePasswordVisibility}
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <Spinner size="sm" className="mr-2" />
                      Logging in...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <LogIn className="mr-2 h-4 w-4" />
                      Login
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-2">
            <div className="text-sm text-muted-foreground text-center">
              Don't have an account?{' '}
              <Link to="/owner-signup" className="text-orange-600 hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </FadeInSection>
    </div>
  );
};

export default OwnerLogin;