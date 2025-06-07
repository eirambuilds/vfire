import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FadeInSection } from '@/components/ui/animations/FadeInSection';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Building, ArrowLeft, Plus, Minus, UserPlus, Sparkles, EyeOff, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

interface EstablishmentInput {
  id: string;
  name: string;
  dtiCertificateNo: string;
}

interface Errors {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  establishments: Record<string, { name?: string; dtiCertificateNo?: string }>;
  general: string;
}

// CSS styles for red asterisk and password input
const styles = `
  .required-asterisk::after {
    content: '*';
    color: red;
    margin-left: 2px;
  }
  .password-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  .password-toggle {
    position: absolute;
    right: 10px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const OwnerSignUp = () => {
  const navigate = useNavigate();
  const { signUp, loading, user, error: authError } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [showIntroModal, setShowIntroModal] = useState(true);
  const [formData, setFormData] = useState({
    firstName: 'Sample',
    middleName: 'Est',
    lastName: 'Owner',
    email: 'sampleestowner@gmail.com',
    password: 'Sample123!',
    confirmPassword: 'Sample123!',
  });
  
  const [establishments, setEstablishments] = useState<EstablishmentInput[]>([
    { id: '1', name: 'Sample Establishment 1', dtiCertificateNo: '123456789' }
  ]);
  
  const [errors, setErrors] = useState<Errors>({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    establishments: {},
    general: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/owner-login');
    }
  }, [user, navigate]);

  const validateField = (field: string, value: string, otherFields?: any) => {
    let error = '';
    switch (field) {
      case 'firstName':
        if (!value.trim()) {
          error = 'First Name is required';
        } else if (!/^[a-zA-Z\s]+$/.test(value)) {
          error = 'First Name must contain only letters and spaces';
        } else if (value.trim().length > 50) {
          error = 'First Name must be 50 characters or less';
        }
        break;
      case 'middleName':
        if (value.trim() && !/^[a-zA-Z\s]+$/.test(value)) {
          error = 'Middle Name must contain only letters and spaces';
        } else if (value.trim().length > 50) {
          error = 'Middle Name must be 50 characters or less';
        }
        break;
      case 'lastName':
        if (!value.trim()) {
          error = 'Last Name is required';
        } else if (!/^[a-zA-Z\s]+$/.test(value)) {
          error = 'Last Name must contain only letters and spaces';
        } else if (value.trim().length > 50) {
          error = 'Last Name must be 50 characters or less';
        }
        break;
      case 'email':
        if (!value.trim()) {
          error = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Invalid email format';
        }
        break;
      case 'password':
        if (!value) {
          error = 'Password is required';
        } else if (value.length < 6) {
          error = 'Password must be at least 6 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(value)) {
          error = 'Password must include uppercase, lowercase, number, and special character';
        }
        break;
      case 'confirmPassword':
        if (!value) {
          error = 'Confirm Password is required';
        } else if (value !== otherFields?.password) {
          error = 'Passwords do not match';
        }
        break;
      case 'estName':
        if (!value.trim()) {
          error = 'Business Name is required';
        } else if (!/^[a-zA-Z0-9\s&'-]+$/.test(value)) {
          error = 'Business Name must contain only letters, numbers, spaces, &, -, or \'';
        } else if (value.trim().length > 100) {
          error = 'Business Name must be 100 characters or less';
        }
        break;
      case 'dtiCertificateNo':
        if (!value.trim()) {
          error = 'DTI Certificate Number is required';
        } else if (!/^\d{6,9}$/.test(value)) {
          error = 'DTI Certificate Number must be 6-9 digits';
        }
        break;
    }
    return error;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData({
      ...formData,
      [id]: value,
    });
    setErrors(prev => ({
      ...prev,
      [id]: validateField(id, value, { password: formData.password }),
      general: '',
    }));
  };
  
  const handleEstablishmentChange = (id: string, field: keyof EstablishmentInput, value: string) => {
    setEstablishments(prev => 
      prev.map(est => 
        est.id === id ? { ...est, [field]: value } : est
      )
    );
    setErrors(prev => ({
      ...prev,
      establishments: {
        ...prev.establishments,
        [id]: {
          ...prev.establishments[id] || {},
          [field]: validateField(field === 'name' ? 'estName' : field, value),
        },
      },
      general: '',
    }));
  };
  
  const addEstablishment = () => {
    setEstablishments(prev => [
      ...prev, 
      { id: String(Date.now()), name: '', dtiCertificateNo: '' }
    ]);
  };
  
  const removeEstablishment = (id: string) => {
    if (establishments.length > 1) {
      setEstablishments(prev => prev.filter(est => est.id !== id));
      setErrors(prev => {
        const newEstablishments = { ...prev.establishments };
        delete newEstablishments[id];
        return { ...prev, establishments: newEstablishments, general: '' };
      });
    }
  };
  
  const validateStep1 = () => {
    const newErrors: Errors = {
      firstName: validateField('firstName', formData.firstName),
      middleName: validateField('middleName', formData.middleName),
      lastName: validateField('lastName', formData.lastName),
      email: validateField('email', formData.email),
      password: validateField('password', formData.password),
      confirmPassword: validateField('confirmPassword', formData.confirmPassword, { password: formData.password }),
      establishments: errors.establishments,
      general: '',
    };
    const isValid = Object.values(newErrors).every(error => !error || error === errors.establishments);
    setErrors(newErrors);
    return isValid;
  };
  
  const validateStep2 = async () => {
    const newErrors: Errors = { ...errors, establishments: {}, general: '' };
    let isValid = true;
    
    const nameSet = new Set<string>();
    const dtiSet = new Set<string>();

    // Local validation for duplicates and field formats
    establishments.forEach(est => {
      const estErrors = {
        name: validateField('estName', est.name),
        dtiCertificateNo: validateField('dtiCertificateNo', est.dtiCertificateNo),
      };
      
      if (!estErrors.name && nameSet.has(est.name.trim())) {
        estErrors.name = 'This Business Name is already used';
        isValid = false;
      } else if (!estErrors.name) {
        nameSet.add(est.name.trim());
      }
      
      if (!estErrors.dtiCertificateNo && dtiSet.has(est.dtiCertificateNo.trim())) {
        estErrors.dtiCertificateNo = 'This DTI Certificate Number is already used';
        isValid = false;
      } else if (!estErrors.dtiCertificateNo) {
        dtiSet.add(est.dtiCertificateNo.trim());
      }
      
      newErrors.establishments[est.id] = estErrors;
      if (estErrors.name || estErrors.dtiCertificateNo) {
        isValid = false;
      }
    });

    if (!isValid) {
      setErrors(newErrors);
      return false;
    }

    // Supabase validation for bplo_existing table
    setIsValidating(true);
    try {
      for (const est of establishments) {
        const { data, error } = await supabase
          .from('bplo_existing')
          .select('dti_number, business_name, first_name, last_name')
          .eq('dti_number', est.dtiCertificateNo.trim())
          .eq('business_name', est.name.trim())
          .eq('first_name', formData.firstName.trim())
          .eq('last_name', formData.lastName.trim())
          .single();

        if (error || !data) {
          newErrors.establishments[est.id] = {
            ...newErrors.establishments[est.id],
            dtiCertificateNo: 'No matching DTI Certificate Number found in database',
            name: 'No matching Business Name found in database',
          };
          newErrors.firstName = newErrors.firstName || 'No matching First Name found in database';
          newErrors.lastName = newErrors.lastName || 'No matching Last Name found in database';
          isValid = false;
        }
      }
    } catch (error) {
      newErrors.general = 'Error validating with database. Please try again later.';
      isValid = false;
    } finally {
      setIsValidating(false);
    }

    setErrors(newErrors);
    return isValid;
  };
  
  const nextStep = async () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && (await validateStep2())) {
      await handleSubmit();
    }
  };
  
  const prevStep = () => {
    setCurrentStep(1);
  };
  
  const handleSubmit = async () => {
    try {
      await signUp(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName,
        establishments,
      });
      console.log('signUp successful'); // Debug log
      if (!authError) {
        toast({
          title: 'Account Created',
          description: (
            <span>
              Account created successfully! Please confirm the email sent to <strong>{formData.email}</strong> to continue.
            </span>
          ),
          className: 'bg-orange-500 text-white border-orange-600',
          duration: 5000,
        });
        setTimeout(() => {
          navigate('/owner-login');
        }, 5000); // Navigate after toast duration
      } else {
        setErrors(prev => ({
          ...prev,
          general: authError || 'Failed to create account. Please try again.',
        }));
      }
    } catch (error) {
      console.error('Unexpected error during signup:', error); // Debug log
      setErrors(prev => ({
        ...prev,
        general: 'An unexpected error occurred. Please try again later.',
      }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-orange-50 to-red-50">
      <style>{styles}</style>
      <Link to="/" className="absolute top-6 left-6 flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Link>
      
      <Dialog open={showIntroModal} onOpenChange={setShowIntroModal}>
        <DialogContent className="sm:max-w-[450px] p-6 bg-white/90 backdrop-blur-md border border-neutral-200/50 shadow-xl rounded-2xl">
          <div className="relative">
            <button
              onClick={() => setShowIntroModal(false)}
              className="absolute right-0 top-0 p-1 text-neutral-500 hover:text-neutral-700 transition-colors focus:outline-none"
            >
              <span className="sr-only">Close</span>
            </button>
            <DialogHeader className="flex flex-col items-center gap-3 text-center">
              <Sparkles className="h-10 w-10 text-orange-500" />
              <DialogTitle className="text-2xl font-bold text-neutral-800">
                Welcome to Owner Sign Up
              </DialogTitle>
              <DialogDescription className="text-neutral-600 text-base">
                Set up your owner account in just two steps:
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 space-y-6">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary/10 text-primary font-semibold rounded-full">
                  1
                </span>
                <div>
                  <h4 className="font-semibold text-neutral-800">Personal Information</h4>
                  <p className="text-sm text-neutral-600 mt-1">
                    Enter your name, email, and a secure password (6+ characters, including uppercase, lowercase, number, and special character).
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary/10 text-primary font-semibold rounded-full">
                  2
                </span>
                <div>
                  <h4 className="font-semibold text-neutral-800">Establishment Details</h4>
                  <p className="text-sm text-neutral-600 mt-1">
                    Add your business name and DTI certificate number (must match DTI records).
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter className="flex justify-center">
              <Button
                onClick={() => setShowIntroModal(false)}
                className="px-8 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Get Started
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <FadeInSection>
        <Card className="w-full max-w-md glass-card border shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-2">
              <Building className="h-10 w-10 text-orange-500" />
            </div>
            <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
            <div className="flex items-center justify-center mt-4">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 1 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  1
                </div>
                <div className={`w-16 h-1 ${currentStep >= 1 ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 2 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  2
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {authError && (
              <p className="text-sm text-red-500 mb-4 text-center">{authError}</p>
            )}
            {errors.general && (
              <p className="text-sm text-red-500 mb-4 text-center">{errors.general}</p>
            )}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="required-asterisk">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        maxLength={50}
                        className={errors.firstName ? 'border-red-500' : ''}
                      />
                      {errors.firstName && (
                        <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="middleName">Middle Name</Label>
                      <Input
                        id="middleName"
                        value={formData.middleName}
                        onChange={handleChange}
                        disabled={loading}
                        maxLength={50}
                        className={errors.middleName ? 'border-red-500' : ''}
                      />
                      {errors.middleName && (
                        <p className="text-xs text-red">{errors.lastName}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="required-asterisk">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      maxLength={50}
                      className={errors.lastName ? 'border-red-500' : ''}
                    />
                    {errors.lastName && (
                      <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="required-asterisk">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="required-asterisk">Password (min 6 chars, mixed)</Label>
                    <div className="password-input-wrapper">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        minLength={6}
                        maxLength={100}
                        className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? <Eye className="h-5 w-5 text-gray-500" /> : <EyeOff className="h-5 w-5 text-gray-500" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-red-500 mt-1">{errors.password}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="required-asterisk">Confirm Password</Label>
                    <div className="password-input-wrapper">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        minLength={6}
                        maxLength={100}
                        className={errors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={loading}
                      >
                        {showConfirmPassword ? <Eye className="h-5 w-5 text-gray-500" /> : <EyeOff className="h-5 w-5 text-gray-500" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
              
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Establishment Details</h3>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addEstablishment}
                    className="flex items-center text-orange-600 hover:bg-orange-50"
                    disabled={loading || isValidating}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Establishment
                  </Button>
                </div>
                
                {establishments.map((est, index) => (
                  <div key={est.id} className="p-3 border rounded-md space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Establishment #{index + 1}</h4>
                      {establishments.length > 0 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeEstablishment(est.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={loading || isValidating}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`estName-${est.id}`} className="required-asterisk">Business Name</Label>
                      <Input
                        id={`estName-${est.id}`}
                        value={est.name}
                        onChange={(e) => handleEstablishmentChange(est.id, 'name', e.target.value)}
                        required
                        disabled={loading || isValidating}
                        maxLength={100}
                        className={errors.establishments[est.id]?.name ? 'border-red-500' : ''}
                      />
                      {errors.establishments[est.id]?.name && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.establishments[est.id].name}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`dtiCert-${est.id}`} className="required-asterisk">DTI Certificate No.</Label>
                      <Input
                        id={`dtiCert-${est.id}`}
                        value={est.dtiCertificateNo}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^\d{0,9}$/.test(value)) {
                            handleEstablishmentChange(est.id, 'dtiCertificateNo', value);
                          }
                        }}
                        required
                        disabled={loading || isValidating}
                        pattern="\d{6,9}"
                        maxLength={9}
                        inputMode="numeric"
                        placeholder="123456789"
                        className={errors.establishments[est.id]?.dtiCertificateNo ? 'border-red-500' : ''}
                      />
                      {errors.establishments[est.id]?.dtiCertificateNo && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.establishments[est.id].dtiCertificateNo}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                
                <p className="text-xs text-muted-foreground italic">
                  Note: All establishments must match DTI records and will be in "Unregistered" status initially. 
                  You can complete registration after login.
                </p>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={isTermsAccepted}
                    onCheckedChange={(checked) => setIsTermsAccepted(checked === true)}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    disabled={loading || isValidating}
                  />
                  <Label htmlFor="terms" className="text-sm">
                    I agree to the{' '}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-600 hover:underline"
                    >
                      Terms and Conditions
                    </a>{' '}
                    &{' '}
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-600 hover:underline"
                    >
                      Privacy Policy
                    </a>.
                  </Label>
                </div>
              </div>
            )}
            
            <div className="flex justify-between mt-6">
              {currentStep > 1 ? (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={prevStep}
                  disabled={loading || isValidating}
                >
                  Back
                </Button>
              ) : (
                <div></div>
              )}
              
              <Button 
                type="button" 
                onClick={nextStep}
                className="bg-orange-600 hover:bg-orange-700"
                disabled={loading || isValidating || (currentStep === 2 && !isTermsAccepted)}
              >
                {loading || isValidating ? (
                  <span className="flex items-center">
                    <Spinner size="sm" className="mr-2" />
                    {currentStep === 2 ? 'Validating...' : 'Processing...'}
                  </span>
                ) : currentStep === 2 ? (
                  <span className="flex items-center">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Account
                  </span>
                ) : (
                  "Next"
                )}
              </Button>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-center">
            <div className="text-sm text-center">
              Already have an account?{" "}
              <Link to="/owner-login" className="text-orange-600 hover:underline">
                Login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </FadeInSection>
    </div>
  );
};

export default OwnerSignUp;