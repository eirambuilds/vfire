import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Checkbox } from "@/components/ui/checkbox";

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Establishment {
  id?: string;
  dti_number?: string;
  name?: string;
  type?: string;
  occupancy?: string;
  storeys?: number;
  floor_area?: number;
  occupants?: number;
  owner_last_name?: string;
  owner_first_name?: string;
  owner_middle_name?: string;
  owner_suffix?: string;
  owner_email?: string;
  owner_mobile?: string;
  owner_landline?: string;
  rep_last_name?: string;
  rep_first_name?: string;
  rep_middle_name?: string;
  rep_suffix?: string;
  rep_email?: string;
  rep_mobile?: string;
  rep_landline?: string;
  street?: string;
  barangay?: string;
  city?: string;
  province?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
}

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  establishment?: Establishment;
  onRegistrationSuccess?: () => void;
}

interface FormData {
  dti_number: string;
  name: string;
  type: string;
  occupancy: string;
  storeys: string;
  floor_area: string;
  occupants: string;
  owner_last_name: string;
  owner_first_name: string;
  owner_middle_name: string;
  owner_suffix: string;
  owner_email: string;
  owner_mobile: string;
  owner_landline: string;
  rep_last_name: string;
  rep_first_name: string;
  rep_middle_name: string;
  rep_suffix: string;
  rep_email: string;
  rep_mobile: string;
  rep_landline: string;
  street: string;
  barangay: string;
  city: string;
  province: string;
  region: string;
  latitude: number | null;
  longitude: number | null;
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  variant = 'default',
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[1200px] max-w-[1200px] p-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className={variant === 'destructive' ? 'text-red-600' : ''}>
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className={variant === 'destructive' ? 'text-red-600' : 'text-gray-600'}>
            {description}
          </p>
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant={variant === 'destructive' ? 'destructive' : 'default'}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export function RegistrationModal({
  isOpen,
  onClose,
  establishment,
  onRegistrationSuccess,
}: RegistrationModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showRepresentative, setShowRepresentative] = useState(false);
  const [isInfoAccurate, setIsInfoAccurate] = useState(false);
  const [isFalseInfoUnderstood, setIsFalseInfoUnderstood] = useState(false);
  const isEditMode = !!establishment?.id;

  // State for notification modal
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    variant: 'default' | 'destructive';
  }>({
    isOpen: false,
    title: '',
    description: '',
    variant: 'default',
  });

  const showNotification = (title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
    setNotification({ isOpen: true, title, description, variant });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };

  const initialFormData: FormData = {
    dti_number: "123789",
    name: "New Establishment",
    type: "Commercial",
    occupancy: "Educational Occupancy",
    storeys: "2",
    floor_area: "150.5",
    occupants: "10",
    owner_last_name: "Owner",
    owner_first_name: "Sample",
    owner_middle_name: "Establishment",
    owner_suffix: "",
    owner_email: "",
    owner_mobile: "09123456789",
    owner_landline: "(028) 123-8162",
    rep_last_name: "Rep",
    rep_first_name: "Sample",
    rep_middle_name: "Establishment",
    rep_suffix: "Jr.",
    rep_email: "rep@example.com",
    rep_mobile: "09123456789",
    rep_landline: "(028) 321-8162",
    street: "PLV",
    barangay: "Maysan",
    city: "Valenzuela",
    province: "Metro Manila",
    region: "NCR",
    latitude: 14.69809630,
    longitude: 120.97881560,
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData | 'location' | 'general', string>>>({});
  const [savedFormData, setSavedFormData] = useState<FormData>(initialFormData);

  useEffect(() => {
    const fetchEstablishmentData = async () => {
      if (!isOpen || !establishment?.id) {
        setFormData(initialFormData);
        setSavedFormData(initialFormData);
        setShowRepresentative(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('establishments')
          .select(`
            id,
            dti_number,
            name,
            type,
            occupancy,
            storeys,
            floor_area,
            occupants,
            owner_last_name,
            owner_first_name,
            owner_middle_name,
            owner_suffix,
            owner_email,
            owner_mobile,
            owner_landline,
            rep_last_name,
            rep_first_name,
            rep_middle_name,
            rep_suffix,
            rep_email,
            rep_mobile,
            rep_landline,
            street,
            barangay,
            city,
            province,
            region,
            latitude,
            longitude
          `)
          .eq('id', establishment.id)
          .single();

        if (error) throw error;

        if (data) {
          const fetchedData = {
            dti_number: data.dti_number || '',
            name: data.name || '',
            type: data.type || '',
            occupancy: data.occupancy || '',
            storeys: data.storeys?.toString() || '',
            floor_area: data.floor_area?.toString() || '',
            occupants: data.occupants?.toString() || '',
            owner_last_name: data.owner_last_name || '',
            owner_first_name: data.owner_first_name || '',
            owner_middle_name: data.owner_middle_name || '',
            owner_suffix: data.owner_suffix || '',
            owner_email: data.owner_email || '',
            owner_mobile: data.owner_mobile || '',
            owner_landline: data.owner_landline || '',
            rep_last_name: data.rep_last_name || '',
            rep_first_name: data.rep_first_name || '',
            rep_middle_name: data.rep_middle_name || '',
            rep_suffix: data.rep_suffix || '',
            rep_email: data.rep_email || '',
            rep_mobile: data.rep_mobile || '',
            rep_landline: data.rep_landline || '',
            street: data.street || '',
            barangay: data.barangay || '',
            city: data.city || 'Valenzuela',
            province: data.province || 'Metro Manila',
            region: data.region || 'NCR',
            latitude: data.latitude || null,
            longitude: data.longitude || null,
          };
          setFormData(fetchedData);
          setSavedFormData(fetchedData);
          setShowRepresentative(
            !!data.rep_last_name ||
            !!data.rep_first_name ||
            !!data.rep_email ||
            !!data.rep_mobile ||
            !!data.rep_landline
          );
        }
      } catch (err) {
        showNotification("Error", "Failed to load establishment data.", "destructive");
      }
    };

    fetchEstablishmentData();
  }, [isOpen, establishment?.id]);

  const hasFormChanged = () => {
    if (!isEditMode || !savedFormData) return true;
    return Object.keys(formData).some(key => {
      const formValue = formData[key as keyof FormData];
      const initialValue = savedFormData[key as keyof FormData];
      return formValue !== initialValue;
    });
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        showNotification("Error", "Failed to fetch user data.", "destructive");
        return;
      }
      if (user?.email && !formData.owner_email) {
        setFormData(prev => ({
          ...prev,
          owner_email: user.email || prev.owner_email,
        }));
      }
    };
    fetchUserData();
  }, [formData.owner_email]);

  useEffect(() => {
    const geocodeAddress = async () => {
      if (!formData.street.trim() || !formData.barangay || step !== 2) return;
      setIsGeocoding(true);
      const fullAddress = `${formData.street}, ${formData.barangay}, ${formData.city}, ${formData.province}, Philippines`;
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`
        );
        const data = await response.json();
        if (data.length > 0) {
          const { lat, lon } = data[0];
          setFormData(prev => ({
            ...prev,
            latitude: parseFloat(lat),
            longitude: parseFloat(lon),
          }));
          setErrors(prev => ({ ...prev, location: '' }));
        } else {
          setErrors(prev => ({ ...prev, location: 'No coordinates found for this address. Please pin manually.' }));
        }
      } catch (err) {
        showNotification("Geocoding Failed", "Could not find coordinates. Please pin manually.", "destructive");
      } finally {
        setIsGeocoding(false);
      }
    };
    geocodeAddress();
  }, [formData.street, formData.barangay, step]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    if (name === 'owner_mobile' || name === 'rep_mobile') {
      value = value.replace(/\D/g, '').slice(0, 11);
    }
    if (name === 'owner_landline' || name === 'rep_landline') {
      const digits = value.replace(/\D/g, '');
      let formatted = '';
      if (digits.length > 0) formatted = '(' + digits.substring(0, 3);
      if (digits.length >= 4) formatted += ') ' + digits.substring(3, 6);
      if (digits.length >= 7) formatted += '-' + digits.substring(6, 10);
      value = formatted.substring(0, 14);
    }
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSameAsOwner = () => {
    setFormData(prev => ({
      ...prev,
      rep_last_name: prev.owner_last_name,
      rep_first_name: prev.owner_first_name,
      rep_middle_name: prev.owner_middle_name,
      rep天地: prev.owner_suffix,
      rep_email: prev.owner_email,
      rep_mobile: prev.owner_mobile,
      rep_landline: prev.owner_landline,
    }));
    setErrors(prev => ({
      ...prev,
      rep_last_name: '',
      rep_first_name: '',
      rep_middle_name: '',
      rep_suffix: '',
      rep_email: '',
      rep_mobile: '',
      rep_landline: '',
    }));
  };

  const validateStep1 = async () => {
    const newErrors: Partial<Record<keyof FormData | 'general', string>> = {};

    if (!formData.dti_number.trim()) {
      newErrors.dti_number = 'DTI Certificate No. is required';
    } else if (!/^\d{6,9}$/.test(formData.dti_number.trim())) {
      newErrors.dti_number = 'DTI Certificate No. must be between 6 and 9 digits';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Establishment name is required';
    }
    if (!formData.type) newErrors.type = 'Type of establishment is required';
    if (!formData.occupancy) newErrors.occupancy = 'Type of occupancy is required';
    if (!formData.storeys || parseInt(formData.storeys) <= 0)
      newErrors.storeys = 'Number of storeys must be a positive integer';
    if (!formData.floor_area || parseFloat(formData.floor_area) <= 0)
      newErrors.floor_area = 'Total floor area must be a positive number';
    if (!formData.occupants || parseInt(formData.occupants) <= 0)
      newErrors.occupants = 'Number of occupants must be a positive integer';

    if (formData.dti_number.trim() && formData.name.trim() && Object.keys(newErrors).length === 0) {
      try {
        let dtiQuery = supabase
          .from('establishments')
          .select('id, dti_number, name')
          .or(`dti_number.eq.${formData.dti_number.trim()},name.eq.${formData.name.trim()}`);

        if (isEditMode && establishment?.id) {
          dtiQuery = dtiQuery.neq('id', establishment.id);
        }

        const { data: existing, error: fetchError } = await dtiQuery;
        if (fetchError) {
          throw new Error('Failed to check establishment details');
        }

        if (existing?.length > 0) {
          existing.forEach((item) => {
            if (item.dti_number === formData.dti_number.trim()) {
              newErrors.dti_number = 'DTI Certificate No. already exists';
            }
            if (item.name === formData.name.trim()) {
              newErrors.name = 'Establishment name already exists';
            }
          });
        }
      } catch (err) {
        newErrors.general = 'Failed to validate establishment details';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Partial<Record<keyof FormData | 'location' | 'general', string>> = {};
    if (!formData.street.trim()) newErrors.street = 'Unit no., Block no./ Building Name / Street Name is required';
    if (!formData.barangay.trim()) newErrors.barangay = 'Barangay is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.province.trim()) newErrors.province = 'Province is required';
    if (!formData.region.trim()) newErrors.region = 'Region is required';
    if (!formData.latitude || !formData.longitude)
      newErrors.location = 'Please pin the exact location on the map';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: Partial<Record<keyof FormData | 'general', string>> = {};
    if (!formData.owner_last_name.trim()) newErrors.owner_last_name = 'Last name is required';
    if (!formData.owner_first_name.trim()) newErrors.owner_first_name = 'First name is required';
    if (!formData.owner_email.trim()) newErrors.owner_email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.owner_email))
      newErrors.owner_email = 'Invalid email format';
    if (!formData.owner_mobile) newErrors.owner_mobile = 'Contact number is required';
    else if (!/^09\d{9}$/.test(formData.owner_mobile))
      newErrors.owner_mobile = 'Contact number must be 11 digits starting with 09';
    if (formData.owner_landline && !/^\(\d{3}\) \d{3}-\d{4}$/.test(formData.owner_landline))
      newErrors.owner_landline = 'Landline must be in (XXX) XXX-XXXX format';
    if (showRepresentative) {
      if (formData.rep_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.rep_email))
        newErrors.rep_email = 'Invalid email format';
      if (formData.rep_mobile && !/^09\d{9}$/.test(formData.rep_mobile))
        newErrors.rep_mobile = 'Contact number must be 11 digits starting with 09';
      if (formData.rep_landline && !/^\(\d{3}\) \d{3}-\d{4}$/.test(formData.rep_landline))
        newErrors.rep_landline = 'Landline must be in (XXX) XXX-XXXX format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAll = () => {
    const step1Valid = validateStep1();
    const step2Valid = validateStep2();
    const step3Valid = validateStep3();
    return step1Valid && step2Valid && step3Valid;
  };

  const handleNext = async (e: React.MouseEvent) => {
    e.preventDefault();
    let isValid = true;
    if (step === 1) isValid = await validateStep1();
    else if (step === 2) isValid = validateStep2();
    else if (step === 3) isValid = validateStep3();

    if (isValid) {
      setStep(prev => (prev + 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    setStep(prev => (prev - 1) as 1 | 2 | 3 | 4);
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setStep(1);
    setErrors({});
    setShowRepresentative(false);
    setIsInfoAccurate(false);
    setIsFalseInfoUnderstood(false);
    onClose();
  };

  const handleEditStep = (targetStep: 1 | 2 | 3) => {
    setStep(targetStep);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== 4) {
      showNotification("Invalid Action", "Please review the summary before submitting.", "destructive");
      return;
    }

    if (!validateAll()) {
      showNotification("Validation Error", "Please review all steps and correct errors.", "destructive");
      return;
    }

    if (!isInfoAccurate || !isFalseInfoUnderstood) {
      showNotification("Certification Required", "Please check both certification boxes before submitting.", "destructive");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user || !user.id) {
        throw new Error("You must be logged in to submit the registration");
      }

      const updateData = {
        owner_id: user.id,
        dti_number: formData.dti_number.trim(),
        name: formData.name.trim(),
        type: formData.type || null,
        occupancy: formData.occupancy || null,
        storeys: parseInt(formData.storeys) || null,
        floor_area: parseFloat(formData.floor_area) || null,
        occupants: parseInt(formData.occupants) || null,
        owner_last_name: formData.owner_last_name.trim() || null,
        owner_first_name: formData.owner_first_name.trim() || null,
        owner_middle_name: formData.owner_middle_name.trim() || null,
        owner_suffix: formData.owner_suffix || null,
        owner_email: formData.owner_email.trim() || null,
        owner_mobile: formData.owner_mobile || null,
        owner_landline: formData.owner_landline || null,
        rep_last_name: showRepresentative ? formData.rep_last_name.trim() || null : null,
        rep_first_name: showRepresentative ? formData.rep_first_name.trim() || null : null,
        rep_middle_name: showRepresentative ? formData.rep_middle_name.trim() || null : null,
        rep_suffix: showRepresentative ? formData.rep_suffix || null : null,
        rep_email: showRepresentative ? formData.rep_email.trim() || null : null,
        rep_mobile: showRepresentative ? formData.rep_mobile || null : null,
        rep_landline: showRepresentative ? formData.rep_landline || null : null,
        street: formData.street.trim() || null,
        barangay: formData.barangay.trim() || null,
        city: formData.city.trim() || null,
        province: formData.province.trim() || null,
        region: formData.region.trim() || null,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
        status: 'pre_registered' as const,
        address: `${formData.street}, ${formData.barangay}, ${formData.city}, ${formData.province}, ${formData.region}`.trim(),
      };

      const upsertData = establishment?.id
        ? { id: establishment.id, ...updateData }
        : { ...updateData };

      const { error: updateError } = await supabase
        .from('establishments')
        .upsert([upsertData]);

      if (updateError) {
        throw new Error(`Registration failed: ${updateError.message}`);
      }

      setFormData(initialFormData);
      setStep(1);
      setShowRepresentative(false);
      setIsInfoAccurate(false);
      setIsFalseInfoUnderstood(false);
      if (onRegistrationSuccess) onRegistrationSuccess();
      showNotification(
        isEditMode ? "Update Successful" : "Registration Successful",
        isEditMode
          ? "Your Establishment registration details have been updated."
          : "Your Establishment registration has been submitted successfully and moved to pre-registered status."
      );
      onClose();
    } catch (err: any) {
      setErrors(prev => ({ ...prev, general: err.message || "An error occurred during submission" }));
      showNotification(
        isEditMode ? "Update Failed" : "Registration Failed",
        err.message || "An error occurred during submission",
        "destructive"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const LocationMarker = () => {
    const map = useMap();
    useEffect(() => {
      if (formData.latitude && formData.longitude) {
        map.flyTo([formData.latitude, formData.longitude], 15);
      }
    }, [formData.latitude, formData.longitude, map]);

    useMapEvents({
      click(e) {
        setFormData(prev => ({
          ...prev,
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
        }));
        setErrors(prev => ({ ...prev, location: '' }));
      },
    });

    return formData.latitude && formData.longitude ? (
      <Marker position={[formData.latitude, formData.longitude]} />
    ) : null;
  };

  const barangays = [
    'Arkong Bato', 'Bagbaguin', 'Balangkas', 'Bignay', 'Bisig', 'Canumay East',
    'Canumay West', 'Coloong', 'Dalandanan', 'Gen. T. de Leon', 'Isla',
    'Karuhatan', 'Lawang Bato', 'Lingunan', 'Mabolo', 'Malanday', 'Malinta',
    'Mapulang Lupa', 'Marulas', 'Maysan', 'Palasan', 'Parada', 'Pasolo',
    'Poblacion', 'Polo', 'Punturin', 'Rincon', 'Tagalag', 'Ugong', 'Viente Reales',
  ];

  const establishmentTypes = ['Commercial', 'Industrial', 'Residential'];
  const occupancyTypes = [
    'Business Occupancy',
    'Day Care',
    'Detention and Correctional Occupancy',
    'Educational Occupancy',
    'Gasoline Service Station',
    'Health Care Occupancy',
    'Industrial Occupancy',
    'Mercantile Occupancy',
    'Miscellaneous Occupancy',
    'Places of Assembly Occupancy',
    'Residential Occupancy',
    'Single and Two Family Dwellings',
    'Small General Business Establishment',
    'Storage Occupancy',
    'Theater Occupancy'
  ];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={isSubmitting ? undefined : handleCancel}>
        <DialogContent className="w-[1200px] max-w-[1200px] p-8 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">
              {isEditMode ? "REGISTRATION FORM" : "REGISTRATION FORM"}
            </DialogTitle>
            <div className="flex items-center justify-center gap-2 mt-4">
              {['Establishment Information', 'Establishment Address', 'Owner/Representative Information', 'Summary'].map((label, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step > index + 1 ? 'bg-primary text-white' : step === index + 1 ? 'bg-primary/20 text-primary' : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className={`ml-2 text-sm ${step === index + 1 ? 'font-medium' : 'text-gray-500'}`}>
                    {label}
                  </span>
                  {index < 3 && <div className="w-6 h-px bg-gray-300 mx-2" />}
                </div>
              ))}
            </div>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="bg-red-50 p-4 rounded-md text-red-600 text-sm flex items-center">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errors.general}
              </div>
            )}

            {step === 1 && (
              <div className="grid grid-cols-2 gap-6 bg-white p-6 rounded-lg border">
                <h3 className="col-span-2 text-lg font-medium text-center">ESTABLISHMENT INFORMATION
                  <p className="col-span-2 text-sm text-gray-600">Please type in all the required information</p>
                </h3>
                <div>
                  <Label htmlFor="name" className="block mb-1 font-medium">
                    Building/Facteatrality/Structure/Business/Establishment Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="h-10"
                    placeholder="e.g., ABC Enterprises"
                    required
                    readOnly={isEditMode}
                    disabled={isEditMode}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 mt-1 flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.name}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="dti_number" className="block mb-1 font-medium">
                    DTI Certificate No. <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dti_number"
                    name="dti_number"
                    type="text"
                    value={formData.dti_number}
                    onChange={handleChange}
                    className="h-10"
                    placeholder="e.g., 123456789"
                    pattern="[0-9]{9}"
                    maxLength={9}
                    inputMode="numeric"
                    onInput={(e) => {
                      const input = e.target as HTMLInputElement;
                      input.value = input.value.replace(/[^0-9]/g, '').slice(0, 9);
                    }}
                    required
                    readOnly={isEditMode}
                    disabled={isEditMode}
                  />
                  {errors.dti_number && (
                    <p className="text-sm text-red-600 mt-1 flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.dti_number}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="type" className="block mb-1 font-medium">
                    Type of Establishment <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.type} onValueChange={(value) => handleSelectChange('type', value)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {establishmentTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-sm text-red-600 mt-1 flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.type}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="occupancy" className="block mb-1 font-medium">
                    Type of Occupancy / Business Nature <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.occupancy} onValueChange={(value) => handleSelectChange('occupancy', value)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select occupancy" />
                    </SelectTrigger>
                    <SelectContent>
                      {occupancyTypes.map((occ) => (
                        <SelectItem key={occ} value={occ}>
                          {occ}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.occupancy && (
                    <p className="text-sm text-red-600 mt-1 flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.occupancy}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="storeys" className="block mb-1 font-medium">
                    No of Storey <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="storeys"
                    name="storeys"
                    type="number"
                    min="1"
                    value={formData.storeys}
                    onChange={handleChange}
                    className="h-10"
                    placeholder="e.g., 2"
                    required
                  />
                  {errors.storeys && (
                    <p className="text-sm text-red-600 mt-1 flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.storeys}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="floor_area" className="block mb-1 font-medium">
                    Total Floor Area (m²) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="floor_area"
                    name="floor_area"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.floor_area}
                    onChange={handleChange}
                    className="h-10"
                    placeholder="e.g., 150.50"
                    required
                  />
                  {errors.floor_area && (
                    <p className="text-sm text-red-600 mt-1 flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.floor_area}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="occupants" className="block mb-1 font-medium">
                    Number of Occupants <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="occupants"
                    name="occupants"
                    type="number"
                    min="1"
                    value={formData.occupants}
                    onChange={handleChange}
                    className="h-10"
                    placeholder="e.g., 10"
                    required
                  />
                  {errors.occupants && (
                    <p className="text-sm text-red-600 mt-1 flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.occupants}
                    </p>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-2 gap-6 bg-white p-6 rounded-lg border">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium mb-2">ESTABLISHMENT ADDRESS
                    <ul className="text-sm text-gray-600 mb-4 list-disc pl-5">
                      <li>Please type in all the required information</li>
                      <li>Please type your address or where your establishment is located.</li>
                      <li>Check If the tagged/pinned location in the map is the exact location of your establishment.</li>
                      <li>If the location tagged in the map is not the exact location of your establishment, kindly drop a pin by CLICKING YOUR MOUSE IN THE EXACT LOCATION of your establishment in the map.</li>
                      <li>Upon update, you will see that the coordinates will be refreshed identifying the exact location you tagged and the land use will be properly be identified.</li>
                    </ul>
                  </h3>
                  <div>
                    <Label htmlFor="street" className="block mb-1 font-medium">Unit no., Block no./ Building Name / Street Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="street"
                      name="street"
                      value={formData.street}
                      onChange={handleChange}
                      className="h-10"
                      placeholder="e.g., 123 Main St."
                      required
                    />
                    {errors.street && (
                      <p className="text-sm text-red-600 mt-1 flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {errors.street}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="barangay" className="block mb-1 font-medium">Barangay <span className="text-red-500">*</span></Label>
                    <Select value={formData.barangay} onValueChange={(value) => handleSelectChange('barangay', value)}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select barangay" />
                      </SelectTrigger>
                      <SelectContent>
                        {barangays.map(barangay => (
                          <SelectItem key={barangay} value={barangay}>{barangay}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.barangay && (
                      <p className="text-sm text-red-600 mt-1 flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {errors.barangay}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="city" className="block mb-1 font-medium">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      readOnly
                      className="h-10 bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <Label htmlFor="province" className="block mb-1 font-medium">Province</Label>
                    <Input
                      id="province"
                      value={formData.province}
                      readOnly
                      className="h-10 bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <Label htmlFor="region" className="block mb-1 font-medium">Region</Label>
                    <Input
                      id="region"
                      value={formData.region}
                      readOnly
                      className="h-10 bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                </div>
                <div>
                  <Label className="block mb-1 font-medium">Map Location <span className="text-red-500">*</span></Label>
                  <div className="relative" style={{ height: '550px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                    {isGeocoding && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                        <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    )}
                    <MapContainer
                      center={[14.6982, 120.9793]}
                      zoom={13}
                      style={{ height: '100%', width: '100%' }}
                      zoomControl={false}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      <ZoomControl position="bottomright" />
                      <LocationMarker />
                    </MapContainer>
                  </div>
                  {formData.latitude && formData.longitude && (
                    <div className="text-sm text-gray-600 mt-2">
                      <p>Current Latitude: {formData.latitude.toFixed(8)}</p>
                      <p>Current Longitude: {formData.longitude.toFixed(8)}</p>
                    </div>
                  )}
                  {errors.location && (
                    <p className="text-sm text-red-600 mt-1 flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.location}
                    </p>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-lg font-medium mb-4">Name of Owner *</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="owner_last_name" className="block mb-1 font-medium">Last Name <span className="text-red-500">*</span></Label>
                      <Input
                        id="owner_last_name"
                        name="owner_last_name"
                        value={formData.owner_last_name}
                        onChange={handleChange}
                        className="h-10"
                        placeholder="e.g., Dela Cruz"
                        required
                      />
                      {errors.owner_last_name && (
                        <p className="text-sm text-red-600 mt-1 flex items-center">
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {errors.owner_last_name}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="owner_first_name" className="block mb-1 font-medium">First Name <span className="text-red-500">*</span></Label>
                      <Input
                        id="owner_first_name"
                        name="owner_first_name"
                        value={formData.owner_first_name}
                        onChange={handleChange}
                        className="h-10"
                        placeholder="e.g., Juan"
                        required
                      />
                      {errors.owner_first_name && (
                        <p className="text-sm text-red-600 mt-1 flex items-center">
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-joint="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {errors.owner_first_name}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="owner_middle_name" className="block mb-1 font-medium">Middle Name</Label>
                      <Input
                        id="owner_middle_name"
                        name="owner_middle_name"
                        value={formData.owner_middle_name}
                        onChange={handleChange}
                        className="h-10"
                        placeholder="e.g., Santos"
                      />
                    </div>
                    <div>
                      <Label htmlFor="owner_suffix" className="block mb-1 font-medium">Suffix</Label>
                      <Select value={formData.owner_suffix} onValueChange={(value) => handleSelectChange('owner_suffix', value)}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select suffix" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Jr.">Jr.</SelectItem>
                          <SelectItem value="Sr.">Sr.</SelectItem>
                          <SelectItem value="II">II</SelectItem>
                          <SelectItem value="III">III</SelectItem>
                          <SelectItem value="IV">IV</SelectItem>
                          <SelectItem value="V">V</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="owner_email" className="block mb-1 font-medium">Email Address <span className="text-red-500">*</span></Label>
                      <Input
                        id="owner_email"
                        name="owner_email"
                        type="email"
                        value={formData.owner_email}
                        onChange={handleChange}
                        className="h-10"
                        placeholder="e.g., juan@example.com"
                        required
                      />
                      {errors.owner_email && (
                        <p className="text-sm text-red-600 mt-1 flex items-center">
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-joint="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {errors.owner_email}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="owner_mobile" className="block mb-1 font-medium">Contact Number <span className="text-red-500">*</span></Label>
                      <Input
                        id="owner_mobile"
                        name="owner_mobile"
                        value={formData.owner_mobile}
                        onChange={handleChange}
                        className="h-10"
                        placeholder="e.g., 09123456789"
                        maxLength={11}
                        required
                      />
                      {errors.owner_mobile && (
                        <p className="text-sm text-red-600 mt-1 flex items-center">
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-joint="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {errors.owner_mobile}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="owner_landline" className="block mb-1 font-medium">Landline</Label>
                      <Input
                        id="owner_landline"
                        name="owner_landline"
                        value={formData.owner_landline}
                        onChange={handleChange}
                        className="h-10"
                        placeholder="e.g., (XXX) XXX-XXXX"
                        maxLength={14}
                      />
                      {errors.owner_landline && (
                        <p className="text-sm text-red-600 mt-1 flex items-center">
                          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-joint="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {errors.owner_landline}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg border">
                  {!showRepresentative ? (
                    <div className="flex justify-center items-center h-full">
                      <Button
                        type="button"
                        onClick={() => setShowRepresentative(true)}
                        className="bg-primary text-white"
                      >
                        Add Representative
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Name of Authorized Representative</h3>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleSameAsOwner}
                        >
                          Same as Owner
                        </Button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="rep_last_name" className="block mb-1 font-medium">Last Name</Label>
                          <Input
                            id="rep_last_name"
                            name="rep_last_name"
                            value={formData.rep_last_name}
                            onChange={handleChange}
                            className="h-10"
                            placeholder="e.g., Santos"
                          />
                        </div>
                        <div>
                          <Label htmlFor="rep_first_name" className="block mb-1 font-medium">First Name</Label>
                          <Input
                            id="rep_first_name"
                            name="rep_first_name"
                            value={formData.rep_first_name}
                            onChange={handleChange}
                            className="h-10"
                            placeholder="e.g., Maria"
                          />
                        </div>
                        <div>
                          <Label htmlFor="rep_middle_name" className="block mb-1 font-medium">Middle Name</Label>
                          <Input
                            id="rep_middle_name"
                            name="rep_middle_name"
                            value={formData.rep_middle_name}
                            onChange={handleChange}
                            className="h-10"
                            placeholder="e.g., Lopez"
                          />
                        </div>
                        <div>
                          <Label htmlFor="rep_suffix" className="block mb-1 font-medium">Suffix</Label>
                          <Select value={formData.rep_suffix} onValueChange={(value) => handleSelectChange('rep_suffix', value)}>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select suffix" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Jr.">Jr.</SelectItem>
                              <SelectItem value="Sr.">Sr.</SelectItem>
                              <SelectItem value="II">II</SelectItem>
                              <SelectItem value="III">III</SelectItem>
                              <SelectItem value="IV">IV</SelectItem>
                              <SelectItem value="V">V</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="rep_email" className="block mb-1 font-medium">Email Address</Label>
                          <Input
                            id="rep_email"
                            name="rep_email"
                            type="email"
                            value={formData.rep_email}
                            onChange={handleChange}
                            className="h-10"
                            placeholder="e.g., maria@example.com"
                          />
                          {errors.rep_email && (
                            <p className="text-sm text-red-600 mt-1 flex items-center">
                              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-joint="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {errors.rep_email}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="rep_mobile" className="block mb-1 font-medium">Contact Number</Label>
                          <Input
                            id="rep_mobile"
                            name="rep_mobile"
                            value={formData.rep_mobile}
                            onChange={handleChange}
                            className="h-10"
                            placeholder="e.g., 09123456789"
                            maxLength={11}
                          />
                          {errors.rep_mobile && (
                            <p className="text-sm text-red-600 mt-1 flex items-center">
                              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-joint="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {errors.rep_mobile}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="rep_landline" className="block mb-1 font-medium">Landline</Label>
                          <Input
                            id="rep_landline"
                            name="rep_landline"
                            value={formData.rep_landline}
                            onChange={handleChange}
                            className="h-10"
                            placeholder="e.g., (XXX) XXX-XXXX"
                            maxLength={14}
                          />
                          {errors.rep_landline && (
                            <p className="text-sm text-red-600 mt-1 flex items-center">
                              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-joint="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {errors.rep_landline}
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-center">Review Your Submission</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-lg border">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">ESTABLISHMENT INFORMATION</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditStep(1)}
                        className="text-orange-500 hover:text-orange-600"
                      >
                        Edit
                      </Button>
                    </div>
                    <dl className="space-y-2 text-sm">
                      <div className="flex">
                        <dt className="font-medium w-1/3">DTI Certificate No.:</dt>
                        <dd>{formData.dti_number}</dd>
                      </div>
                      <div className="flex">
                        <dt className="font-medium w-1/3">Establishment Name:</dt>
                        <dd>{formData.name}</dd>
                      </div>
                      <div className="flex">
                        <dt className="font-medium w-1/3">Type of Establishment:</dt>
                        <dd>{formData.type || 'N/A'}</dd>
                      </div>
                      <div className="flex">
                        <dt className="font-medium w-1/3">Type of Occupancy:</dt>
                        <dd>{formData.occupancy || 'N/A'}</dd>
                      </div>
                      <div className="flex">
                        <dt className="font-medium w-1/3">No of Storey:</dt>
                        <dd>{formData.storeys || 'N/A'}</dd>
                      </div>
                      <div className="flex">
                        <dt className="font-medium w-1/3">Total Floor Area:</dt>
                        <dd>{formData.floor_area ? `${formData.floor_area} m²` : 'N/A'}</dd>
                      </div>
                      <div className="flex">
                        <dt className="font-medium w-1/3">Number of Occupants:</dt>
                        <dd>{formData.occupants || 'N/A'}</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="bg-white p-6 rounded-lg border">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">ESTABLISHMENT ADDRESS</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditStep(2)}
                        className="text-orange-500 hover:text-orange-600"
                      >
                        Edit
                      </Button>
                    </div>
                    <dl className="space-y-2 text-sm">
                      <div className="flex">
                        <dt className="font-medium w-1/3">Street Name:</dt>
                        <dd>{formData.street || 'N/A'}</dd>
                      </div>
                      <div className="flex">
                        <dt className="font-medium w-1/3">Barangay:</dt>
                        <dd>{formData.barangay || 'N/A'}</dd>
                      </div>
                      <div className="flex">
                        <dt className="font-medium w-1/3">City:</dt>
                        <dd>{formData.city || 'N/A'}</dd>
                      </div>
                      <div className="flex">
                        <dt className="font-medium w-1/3">Province:</dt>
                        <dd>{formData.province || 'N/A'}</dd>
                      </div>
                      <div className="flex">
                        <dt className="font-medium w-1/3">Region:</dt>
                        <dd>{formData.region || 'N/A'}</dd>
                      </div>
                      <div className="flex">
                        <dt className="font-medium w-1/3">Map Location:</dt>
                        <dd>
                          {formData.latitude && formData.longitude
                            ? `Lat ${formData.latitude.toFixed(8)}, Long ${formData.longitude.toFixed(8)}`
                            : 'N/A'}
                        </dd>
                      </div>
                      <div className="flex">
                        <dt className="font-medium w-1/3">Full Address:</dt>
                        <dd className="w-2/3">{`${formData.street}, ${formData.barangay}, ${formData.city}, ${formData.province}, ${formData.region}` || 'N/A'}</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="bg-white p-6 rounded-lg border">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">Name of Owner</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditStep(3)}
                        className="text-orange-500 hover:text-orange-600"
                      >
                        Edit
                      </Button>
                    </div>
                    <dl className="space-y-2 text-sm">
                      <div className="flex">
                        <dt className="font-medium w-1/3">Name:</dt>
                        <dd>
                          {formData.owner_first_name} {formData.owner_middle_name || ''} {formData.owner_last_name}
                          {formData.owner_suffix ? ` ${formData.owner_suffix}` : ''}
                        </dd>
                      </div>
                      <div className="flex">
                        <dt className="font-medium w-1/3">Email Address:</dt>
                        <dd>{formData.owner_email || 'N/A'}</dd>
                      </div>
                      <div className="flex">
                        <dt className="font-medium w-1/3">Contact Number:</dt>
                        <dd>{formData.owner_mobile || 'N/A'}</dd>
                      </div>
                      <div className="flex">
                        <dt className="font-medium w-1/3">Landline:</dt>
                        <dd>{formData.owner_landline || 'N/A'}</dd>
                      </div>
                    </dl>
                  </div>
                  {showRepresentative && (
                    <div className="bg-white p-6 rounded-lg border">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium">Name of Authorized Representative</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditStep(3)}
                          className="text-orange-500 hover:text-orange-600"
                        >
                          Edit
                        </Button>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex">
                          <dt className="font-medium w-1/3">Name:</dt>
                          <dd>
                            {formData.rep_first_name || formData.rep_last_name
                              ? `${formData.rep_first_name || ''} ${formData.rep_middle_name || ''} ${formData.rep_last_name || ''}${formData.rep_suffix ? ` ${formData.rep_suffix}` : ''}`.trim()
                              : 'N/A'}
                          </dd>
                        </div>
                        <div className="flex">
                          <dt className="font-medium w-1/3">Email Address:</dt>
                          <dd>{formData.rep_email || 'N/A'}</dd>
                        </div>
                        <div className="flex">
                          <dt className="font-medium w-1/3">Contact Number:</dt>
                          <dd>{formData.rep_mobile || 'N/A'}</dd>
                        </div>
                        <div className="flex">
                          <dt className="font-medium w-1/3">Landline:</dt>
                          <dd>{formData.rep_landline || 'N/A'}</dd>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-white p-6 rounded-lg border">
                  <h4 className="font-medium mb-4">CERTIFICATION</h4>
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="info-accurate"
                      checked={isInfoAccurate}
                      onCheckedChange={(checked) => setIsInfoAccurate(checked as boolean)}
                    />
                    <Label htmlFor="info-accurate" className="text-sm">
                      I certify that the information provided in this application is accurate and complete.
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="false-info"
                      checked={isFalseInfoUnderstood}
                      onCheckedChange={(checked) => setIsFalseInfoUnderstood(checked as boolean)}
                    />
                    <Label htmlFor="false-info" className="text-sm">
                      I understand that providing false information may result in disqualification for registration.
                    </Label>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting || isGeocoding}
                data-align="left"
              >
                Cancel
              </Button>
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isSubmitting || isGeocoding}
                  data-align="left"
                >
                  Back
                </Button>
              )}
              {step < 4 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting || isGeocoding}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting || (isEditMode && !hasFormChanged()) || !isInfoAccurate || !isFalseInfoUnderstood}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          stroke-width="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {isEditMode ? "Saving..." : "Registering..."}
                    </span>
                  ) : isEditMode ? (
                    "Submit"
                  ) : (
                    "Register"
                  )}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={closeNotification}
        title={notification.title}
        description={notification.description}
        variant={notification.variant}
      />
    </>
  );
}