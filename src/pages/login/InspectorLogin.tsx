
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FadeInSection } from '@/components/ui/animations/FadeInSection';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ClipboardCheck, ArrowLeft, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/spinner';

const InspectorLogin = () => {
  const { signIn, loading, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/inspector');
    }
  }, [user, navigate]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter both email and password.",
      });
      return;
    }
    
    try {
      await signIn(formData.email, formData.password, 'inspector');
    } catch (error) {
      // Error is handled inside signIn function
      console.error('Login error:', error);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-amber-50 to-orange-50">
      <Link to="/" className="absolute top-6 left-6 flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Link>
      
      <FadeInSection>
        <Card className="w-full max-w-md glass-card border border-amber-200 shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-2">
              <ClipboardCheck className="h-10 w-10 text-amber-500" />
            </div>
            <CardTitle className="text-2xl font-bold">Fire Inspector Login</CardTitle>
            <CardDescription>
              Enter your credentials to access your inspector account
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    placeholder="inspector@example.com"
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
                    <Link
                      to="#"
                      className="text-sm text-amber-600 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    required
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="bg-background/50"
                    disabled={loading}
                    placeholder="••••••••"
                  />
                </div>
                
                <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={loading}>
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
            <div className="text-sm text-muted-foreground mt-2 text-center">
              Inspector accounts are created by administrators.
            </div>
          </CardFooter>
        </Card>
      </FadeInSection>
    </div>
  );
};

export default InspectorLogin;
