import React, { useState, useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Upload, XCircle, Loader2, CheckCircle, ChevronUp, ChevronDown } from "lucide-react";

type CertificationType = 'FSEC' | 'FSIC-Occupancy' | 'FSIC-Business';

interface FormData {
  dti_number: string;
  establishmentName: string;
  type: string;
  occupancy: string;
  storeys: string;
  floor_area: string;
  occupants: string;
  owner_first_name: string;
  owner_last_name: string;
  owner_middle_name: string;
  owner_suffix: string;
  owner_email: string;
  owner_mobile: string;
  owner_landline: string;
  rep_first_name: string;
  rep_last_name: string;
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
  contractorName: string;
  fsecNumber: string;
  occupancyPermitNo: string;
}

interface Establishment {
  id: string;
  name: string;
  dti_number: string;
  type: string;
  occupancy: string;
  storeys: string;
  floor_area: string;
  occupants: string;
  owner_first_name: string;
  owner_last_name: string;
  owner_middle_name: string;
  owner_suffix: string;
  owner_email: string;
  owner_mobile: string;
  owner_landline: string;
  rep_first_name: string;
  rep_last_name: string;
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

interface ApplicationData {
  id: string;
  establishment_id: string;
  type: CertificationType;
  business_status: 'New' | 'Renewal' | null;
  dti_number: string;
  establishment_name: string;
  establishment_type: string | null;
  occupancy: string | null;
  storeys: string | null;
  floor_area: string | null;
  occupants: string | null;
  owner_first_name: string;
  owner_last_name: string;
  owner_middle_name: string | null;
  owner_suffix: string | null;
  owner_email: string;
  owner_mobile: string;
  owner_landline: string | null;
  rep_first_name: string | null;
  rep_last_name: string | null;
  rep_middle_name: string | null;
  rep_suffix: string | null;
  rep_email: string | null;
  rep_mobile: string | null;
  rep_landline: string | null;
  street: string;
  barangay: string;
  city: string | null;
  province: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  contractor_name: string | null;
  fsec_number: string | null;
  occupancy_permit_no: string | null;
  [key: string]: any;
}

interface CertificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: {
    establishment_id: string;
    applicationType: CertificationType;
    applicationData: ApplicationData | null;
  };
  onApplicationSubmitted: (newApplication: any) => void;
}

const documentRequirements: Record<string, { label: string; required: boolean }[]> = {
  FSEC: [
    { label: 'Architectural Documents', required: false },
    { label: 'Civil/Structural Documents', required: false },
    { label: 'Mechanical Documents', required: false },
    { label: 'Electrical Documents', required: false },
    { label: 'Plumbing Documents', required: false },
    { label: 'Sanitary Documents', required: false },
    { label: 'Fire Protection Documents', required: false },
    { label: 'Electronics Documents', required: false },
    { label: 'Fire Safety Compliance Report', required: false },
    { label: 'Cost Estimates Signed and Sealed', required: false },
    { label: 'Notarized Cost Estimates', required: false },
  ],
  'FSIC-Occupancy': [
    { label: 'Endorsement from Office of the Building Official (OBO)', required: false },
    { label: 'Certificate of Completion', required: false },
    { label: 'Certified True Copy of Assessment Fee for Occupancy', required: false },
    { label: 'As Built Plan', required: false },
    { label: 'Fire Safety Compliance and Commissioning Report (FSCCR)', required: false },
    { label: 'Fire Safety Evaluation Clearance', required: false },
  ],
  'FSIC-Business-New': [
    { label: 'Certified True Copy of Valid Certificate of Occupancy', required: false },
    { label: 'Affidavit of Undertaking (No Substantial Changes)', required: false },
    { label: 'Assessment of Business Permit Fee/Tax Assessment Bill from BPLO', required: false },
    { label: 'Copy of Fire Insurance', required: false },
  ],
  'FSIC-Business-Renewal': [
    { label: 'Assessment of the Business Permit Fee/Tax Assessment Bill from BPLO', required: false },
    { label: 'Fire Safety Maintenance Report (FSMR)', required: false },
    { label: 'Copy of Fire Insurance', required: false },
    { label: 'Fire Safety Clearance for Welding, Cutting, and Other Hot Work Operations', required: false },
  ],
};

const documentToColumnMap: Record<string, string> = {
  architecturaldocuments: 'architectural_documents',
  civilstructuraldocuments: 'civil_structural_documents',
  mechanicaldocuments: 'mechanical_documents',
  electricaldocuments: 'electrical_documents',
  plumbingdocuments: 'plumbing_documents',
  sanitarydocuments: 'sanitary_documents',
  fireprotectiondocuments: 'fire_protection_documents',
  electronicsdocuments: 'electronics_documents',
  firesafetycompliancereport: 'fire_safety_compliance_report',
  costestimatessignedandsealed: 'cost_estimates_signed_sealed',
  notarizedcostestimates: 'notarized_cost_estimates',
  endorsementfromofficeofthebuildingofficialobo: 'endorsement_obo',
  certificateofcompletion: 'certificate_of_completion',
  certifiedtruecopyofassessmentfeeforoccupancy: 'assessment_fee_occupancy',
  asbuiltplan: 'as_built_plan',
  firesafetycomplianceandcommissioningreportfsccr: 'fire_safety_compliance_commissioning_report',
  firesafetyevaluationclearance: 'fire_safety_evaluation_clearance',
  certifiedtruecopyofvalidcertificateofoccupancy: 'certificate_of_occupancy',
  affidavitofundertakingnosubstantialchanges: 'affidavit_no_substantial_changes',
  assessmentofbusinesspermitfeetaxassessmentbillfrombplo: 'business_permit_fee_assessment_new',
  copyoffireinsurance: 'fire_insurance_new',
  assessmentofthebusinesspermitfeetaxassessmentbillfrombplo: 'business_permit_fee_assessment_renewal',
  firesafetymaintenancereportfsmr: 'fire_safety_maintenance_report',
  copyoffireinsurancerenewal: 'fire_insurance_renewal',
  firesafetyclearanceforweldingcuttingandotherhotworkoperations: 'fire_safety_clearance_hot_work',
};

export function CertificationModal({ open, onOpenChange, initialData, onApplicationSubmitted }: CertificationModalProps) {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [certificationType, setCertificationType] = useState<CertificationType>(initialData.applicationType);
  const [businessStatus, setBusinessStatus] = useState<'New' | 'Renewal' | null>(null);
  const [formData, setFormData] = useState<FormData>({
    dti_number: '',
    establishmentName: '',
    type: '',
    occupancy: '',
    storeys: '',
    floor_area: '',
    occupants: '',
    owner_first_name: '',
    owner_last_name: '',
    owner_middle_name: '',
    owner_suffix: '',
    owner_email: '',
    owner_mobile: '',
    owner_landline: '',
    rep_first_name: '',
    rep_last_name: '',
    rep_middle_name: '',
    rep_suffix: '',
    rep_email: '',
    rep_mobile: '',
    rep_landline: '',
    street: '',
    barangay: '',
    city: '',
    province: '',
    region: '',
    latitude: null,
    longitude: null,
    contractorName: '',
    fsecNumber: '',
    occupancyPermitNo: '',
  });
  const [documents, setDocuments] = useState<Record<string, File | null>>({});
  const [existingDocumentUrls, setExistingDocumentUrls] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [existingApplicationId, setExistingApplicationId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [selectedEstablishmentId, setSelectedEstablishmentId] = useState<string>(initialData.establishment_id);
  const [isCertified, setIsCertified] = useState(false);
  const [showEstablishmentDetails, setShowEstablishmentDetails] = useState(true);
  const [showAddressDetails, setShowAddressDetails] = useState(true);
  const [showOwnerDetails, setShowOwnerDetails] = useState(true);
  const [showRepDetails, setShowRepDetails] = useState(true);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({ title: "Authentication Error", description: "Please log in.", variant: "destructive" });
        return;
      }
      setUserId(session.user.id);

      setIsLoadingData(true);

      // Fetch establishments
      const { data: establishmentsData, error: establishmentsError } = await supabase
        .from('establishments')
        .select('*')
        .eq('status', 'registered')
        .eq('owner_id', session.user.id);

      if (establishmentsError) {
        toast({ title: "Error", description: "Failed to fetch establishments.", variant: "destructive" });
      } else {
        setEstablishments(establishmentsData || []);
      }

      if (open && initialData.applicationData) {
        const app = initialData.applicationData;
        setCertificationType(app.type);
        setBusinessStatus(app.business_status);
        setExistingApplicationId(app.id);
        setSelectedEstablishmentId(app.establishment_id);

        setFormData({
          dti_number: app.dti_number || '',
          establishmentName: app.establishment_name || '',
          type: app.establishment_type || '',
          occupancy: app.occupancy || '',
          storeys: app.storeys || '',
          floor_area: app.floor_area || '',
          occupants: app.occupants || '',
          owner_first_name: app.owner_first_name || '',
          owner_last_name: app.owner_last_name || '',
          owner_middle_name: app.owner_middle_name || '',
          owner_suffix: app.owner_suffix || '',
          owner_email: app.owner_email || '',
          owner_mobile: app.owner_mobile || '',
          owner_landline: app.owner_landline || '',
          rep_first_name: app.rep_first_name || '',
          rep_last_name: app.rep_last_name || '',
          rep_middle_name: app.rep_middle_name || '',
          rep_suffix: app.rep_suffix || '',
          rep_email: app.rep_email || '',
          rep_mobile: app.rep_mobile || '',
          rep_landline: app.rep_landline || '',
          street: app.street || '',
          barangay: app.barangay || '',
          city: app.city || '',
          province: app.province || '',
          region: app.region || '',
          latitude: app.latitude || null,
          longitude: app.longitude || null,
          contractorName: app.contractor_name || '',
          fsecNumber: app.fsec_number || '',
          occupancyPermitNo: app.occupancy_permit_no || '',
        });

        // Initialize documents and fetch existing document URLs
        const docKey = app.type === 'FSIC-Business' ? `FSIC-Business-${app.business_status}` : app.type;
        const requiredDocs = documentRequirements[docKey] || [];
        const initialDocs: Record<string, File | null> = {};
        const initialDocUrls: Record<string, string> = {};

        for (const doc of requiredDocs) {
          const docKey = doc.label.toLowerCase().replace(/[^a-z0-9]/g, '');
          const columnName = documentToColumnMap[docKey];
          initialDocs[docKey] = null;
          if (columnName && app[columnName]) {
            initialDocUrls[docKey] = app[columnName];
          }
        }
        setDocuments(initialDocs);
        setExistingDocumentUrls(initialDocUrls);
      } else if (open && selectedEstablishmentId) {
        // Fetch establishment details
        const { data: establishmentData, error: establishmentError } = await supabase
          .from('establishments')
          .select('*')
          .eq('id', selectedEstablishmentId)
          .eq('owner_id', session.user.id)
          .single();

        if (establishmentError) {
          toast({ title: "Error", description: "Failed to fetch establishment details.", variant: "destructive" });
        } else if (establishmentData) {
          setFormData({
            dti_number: establishmentData.dti_number || '',
            establishmentName: establishmentData.name || '',
            type: establishmentData.type || '',
            occupancy: establishmentData.occupancy || '',
            storeys: establishmentData.storeys || '',
            floor_area: establishmentData.floor_area || '',
            occupants: establishmentData.occupants || '',
            owner_first_name: establishmentData.owner_first_name || '',
            owner_last_name: establishmentData.owner_last_name || '',
            owner_middle_name: establishmentData.owner_middle_name || '',
            owner_suffix: establishmentData.owner_suffix || '',
            owner_email: establishmentData.owner_email || '',
            owner_mobile: establishmentData.owner_mobile || '',
            owner_landline: establishmentData.owner_landline || '',
            rep_first_name: establishmentData.rep_first_name || '',
            rep_last_name: establishmentData.rep_last_name || '',
            rep_middle_name: establishmentData.rep_middle_name || '',
            rep_suffix: establishmentData.rep_suffix || '',
            rep_email: establishmentData.rep_email || '',
            rep_mobile: establishmentData.rep_mobile || '',
            rep_landline: establishmentData.rep_landline || '',
            street: establishmentData.street || '',
            barangay: establishmentData.barangay || '',
            city: establishmentData.city || '',
            province: establishmentData.province || '',
            region: establishmentData.region || '',
            latitude: establishmentData.latitude || null,
            longitude: establishmentData.longitude || null,
            contractorName: 'Sample Contractor Name',
            fsecNumber: '123345',
            occupancyPermitNo: '678890',
          });
        }

        // Check for existing applications
        const { data: existingApps, error: appError } = await supabase
          .from('applications')
          .select('id, architectural_documents, civil_structural_documents, mechanical_documents, electrical_documents, plumbing_documents, sanitary_documents, fire_protection_documents, electronics_documents, fire_safety_compliance_report, cost_estimates_signed_sealed, notarized_cost_estimates, endorsement_obo, certificate_of_completion, assessment_fee_occupancy, as_built_plan, fire_safety_compliance_commissioning_report, fire_safety_evaluation_clearance, certificate_of_occupancy, affidavit_no_substantial_changes, business_permit_fee_assessment_new, fire_insurance_new, business_permit_fee_assessment_renewal, fire_safety_maintenance_report, fire_insurance_renewal, fire_safety_clearance_hot_work')
          .eq('establishment_id', selectedEstablishmentId)
          .eq('type', initialData.applicationType)
          .eq('status', 'pending')
          .eq('owner_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (appError) {
          toast({ title: "Error", description: "Failed to check existing applications.", variant: "destructive" });
        } else if (existingApps?.length) {
          setExistingApplicationId(existingApps[0].id);
          // Set existing document URLs
          const docKey = initialData.applicationType === 'FSIC-Business' ? `FSIC-Business-${businessStatus || 'New'}` : initialData.applicationType;
          const requiredDocs = documentRequirements[docKey] || [];
          const initialDocUrls: Record<string, string> = {};

          for (const doc of requiredDocs) {
            const docKey = doc.label.toLowerCase().replace(/[^a-z0-9]/g, '');
            const columnName = documentToColumnMap[docKey];
            if (columnName && existingApps[0][columnName]) {
              initialDocUrls[docKey] = existingApps[0][columnName];
            }
          }
          setExistingDocumentUrls(initialDocUrls);
        }

        // Initialize documents
        const docKey = initialData.applicationType === 'FSIC-Business' ? `FSIC-Business-${businessStatus || 'New'}` : initialData.applicationType;
        const requiredDocs = documentRequirements[docKey] || [];
        const initialDocs: Record<string, File | null> = {};
        for (const doc of requiredDocs) {
          const docKey = doc.label.toLowerCase().replace(/[^a-z0-9]/g, '');
          initialDocs[docKey] = null;
        }
        setDocuments(initialDocs);
      }
      setIsLoadingData(false);
    };

    fetchData();
  }, [open, selectedEstablishmentId, initialData.applicationType, initialData.applicationData, toast]);

  const handleEstablishmentChange = (value: string) => {
    setSelectedEstablishmentId(value);
  };

  const validateFile = (file: File | null): boolean => {
    if (!file) return false;
    if (file.size > 20 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, file: 'File size exceeds 20MB limit' }));
      return false;
    }
    // Check if file is a video
    const videoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'];
    if (videoTypes.includes(file.type)) {
      setErrors((prev) => ({ ...prev, file: 'Video files are not allowed' }));
      return false;
    }
    return true;
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!certificationType) newErrors.certificationType = 'Please select a certification type';
    if (certificationType === 'FSIC-Business' && !businessStatus) newErrors.businessStatus = 'Please select New or Renewal';
    if (!formData.dti_number) newErrors.dti_number = 'DTI number is required';
    if (!formData.establishmentName) newErrors.establishmentName = 'Establishment name is required';
    if (!formData.street) newErrors.street = 'Street is required';
    if (!formData.barangay) newErrors.barangay = 'Barangay is required';
    if (!formData.owner_first_name) newErrors.owner_first_name = 'Owner first name is required';
    if (!formData.owner_last_name) newErrors.owner_last_name = 'Owner last name is required';
    if (!formData.owner_email) newErrors.owner_email = 'Owner email is required';
    if (!formData.owner_mobile) newErrors.owner_mobile = 'Owner mobile is required';

    if (certificationType === 'FSEC') {
      if (!formData.contractorName) newErrors.contractorName = 'Contractor name is required';
      else if (!/^[a-zA-Z\s]+$/.test(formData.contractorName)) newErrors.contractorName = 'Contractor name must contain only letters';
    }
    if (certificationType === 'FSIC-Occupancy') {
      if (!formData.fsecNumber) newErrors.fsecNumber = 'FSEC number is required';
      else if (!/^\d{6,9}$/.test(formData.fsecNumber)) newErrors.fsecNumber = 'FSEC number must be 6-9 digits';
    }
    if (certificationType === 'FSIC-Business') {
      if (!formData.occupancyPermitNo) newErrors.occupancyPermitNo = 'Occupancy permit no. is required';
      else if (!/^\d{6,9}$/.test(formData.occupancyPermitNo)) newErrors.occupancyPermitNo = 'Occupancy permit no. must be 6-9 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    const docKey = certificationType === 'FSIC-Business' ? `FSIC-Business-${businessStatus}` : certificationType;
    const requiredDocs = documentRequirements[docKey]?.filter((doc) => doc.required) || [];

    for (const doc of requiredDocs) {
      const docKey = doc.label.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!documents[docKey] && !existingDocumentUrls[docKey]) {
        newErrors[docKey] = `${doc.label} is required`;
      } else if (documents[docKey] && !validateFile(documents[docKey])) {
        newErrors[docKey] = `${doc.label} must be a PDF under 20MB`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (docLabel: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    const docKey = docLabel.toLowerCase().replace(/[^a-z0-9]/g, '');
    setDocuments((prev) => ({ ...prev, [docKey]: file }));
    if (file && validateFile(file)) {
      setErrors((prev) => ({ ...prev, [docKey]: '' }));
      // Remove existing URL if a new file is uploaded
      setExistingDocumentUrls((prev) => ({ ...prev, [docKey]: '' }));
    }
  };

  const removeFile = (docLabel: string) => {
    const docKey = docLabel.toLowerCase().replace(/[^a-z0-9]/g, '');
    setDocuments((prev) => ({ ...prev, [docKey]: null }));
    setExistingDocumentUrls((prev) => ({ ...prev, [docKey]: '' }));
    if (fileInputRefs.current[docKey]) fileInputRefs.current[docKey]!.value = '';
    setErrors((prev) => ({ ...prev, [docKey]: '' }));
  };

  const handleFilePreview = (file: File | string) => {
    if (typeof file === 'string') {
      window.open(file, '_blank');
    } else {
      const url = URL.createObjectURL(file);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  const uploadFileToSupabase = async (file: File, path: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error } = await supabase.storage.from('application-documents').upload(filePath, file);
    if (error) throw error;

    const { data } = supabase.storage.from('application-documents').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => {
    if (step > 1) setStep((prev) => (prev - 1) as 1 | 2 | 3);
  };

  const resetForm = () => {
    setFormData({
      dti_number: '',
      establishmentName: '',
      type: '',
      occupancy: '',
      storeys: '',
      floor_area: '',
      occupants: '',
      owner_first_name: '',
      owner_last_name: '',
      owner_middle_name: '',
      owner_suffix: '',
      owner_email: '',
      owner_mobile: '',
      owner_landline: '',
      rep_first_name: '',
      rep_last_name: '',
      rep_middle_name: '',
      rep_suffix: '',
      rep_email: '',
      rep_mobile: '',
      rep_landline: '',
      street: '',
      barangay: '',
      city: '',
      province: '',
      region: '',
      latitude: null,
      longitude: null,
      contractorName: '',
      fsecNumber: '',
      occupancyPermitNo: '',
    });
    setDocuments({});
    setExistingDocumentUrls({});
    setStep(1);
    setErrors({});
    setCertificationType(initialData.applicationType);
    setBusinessStatus(null);
    setExistingApplicationId(null);
    setSelectedEstablishmentId(initialData.establishment_id);
    setIsCertified(false);
    setShowEstablishmentDetails(true);
    setShowAddressDetails(true);
    setShowOwnerDetails(true);
    setShowRepDetails(true);
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!isCertified) {
    toast({
      title: "Certification Required",
      description: "Please certify the information.",
      variant: "destructive",
    });
    return;
  }
  if (!validateStep1() || !validateStep2()) {
    toast({
      title: "Validation Error",
      description: "Please correct all errors.",
      variant: "destructive",
    });
    return;
  }
  if (!userId || !selectedEstablishmentId) {
    toast({
      title: "Error",
      description: "User or establishment data missing.",
      variant: "destructive",
    });
    return;
  }

  try {
    setIsSubmitting(true);
    const documentPaths: Record<string, string> = {};
    const docKey =
      certificationType === "FSIC-Business"
        ? `FSIC-Business-${businessStatus}`
        : certificationType;
    for (const doc of documentRequirements[docKey] || []) {
      const docKey = doc.label.toLowerCase().replace(/[^a-z0-9]/g, "");
      const columnName = documentToColumnMap[docKey];
      if (columnName) {
        if (documents[docKey]) {
          // Upload new file
          const filePath = await uploadFileToSupabase(
            documents[docKey]!,
            `${selectedEstablishmentId}/${columnName}`
          );
          documentPaths[columnName] = filePath;
        } else if (existingDocumentUrls[docKey]) {
          // Keep existing file URL
          documentPaths[columnName] = existingDocumentUrls[docKey];
        }
      }
    }

    const applicationData = {
      establishment_id: selectedEstablishmentId,
      type: certificationType,
      business_status: certificationType === "FSIC-Business" ? businessStatus : null,
      status: "pending" as const,
      owner_id: userId,
      submitted_at: new Date().toISOString(),
      certificate_url: null,
      rejection_reasons: [],
      rejection_notes: null,
      dti_number: formData.dti_number,
      establishment_name: formData.establishmentName,
      establishment_type: formData.type || null,
      occupancy: formData.occupancy || null,
      storeys: formData.storeys || null,
      floor_area: formData.floor_area || null,
      occupants: formData.occupants || null,
      owner_first_name: formData.owner_first_name,
      owner_last_name: formData.owner_last_name,
      owner_middle_name: formData.owner_middle_name || null,
      owner_suffix: formData.owner_suffix || null,
      owner_email: formData.owner_email,
      owner_mobile: formData.owner_mobile,
      owner_landline: formData.owner_landline || null,
      rep_first_name: formData.rep_first_name || null,
      rep_last_name: formData.rep_last_name || null,
      rep_middle_name: formData.rep_middle_name || null,
      rep_suffix: formData.rep_suffix || null,
      rep_email: formData.rep_email || null,
      rep_mobile: formData.rep_mobile || null,
      rep_landline: formData.rep_landline || null,
      street: formData.street,
      barangay: formData.barangay,
      city: formData.city || null,
      province: formData.province || null,
      region: formData.region || null,
      latitude: formData.latitude,
      longitude: formData.longitude,
      contractor_name: certificationType === "FSEC" ? formData.contractorName : null,
      fsec_number:
        certificationType === "FSIC-Occupancy" ? formData.fsecNumber : null,
      occupancy_permit_no:
        certificationType === "FSIC-Business" ? formData.occupancyPermitNo : null,
      ...documentPaths,
    };

    // Always check for existing pending applications
    const { data: existingApps, error: checkError } = await supabase
      .from("applications")
      .select("id")
      .eq("establishment_id", selectedEstablishmentId)
      .eq("type", certificationType)
      .eq("status", "pending")
      .eq("owner_id", userId);
    if (checkError) throw checkError;

    if (existingApps?.length && !existingApplicationId) {
      toast({
        title: "Error",
        description: "A pending application already exists for this establishment and certification type.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    let data;
    if (existingApplicationId) {
      // Update existing application
      const { data: updatedData, error } = await supabase
        .from("applications")
        .update({ ...applicationData, updated_at: new Date().toISOString() })
        .eq("id", existingApplicationId)
        .eq("owner_id", userId)
        .select()
        .single();
      if (error) throw error;
      data = updatedData;
    } else {
      // Insert new application
      const { data: insertedData, error } = await supabase
        .from("applications")
        .insert([applicationData])
        .select()
        .single();
      if (error) throw error;
      data = insertedData;
    }

    toast({
      title: "Application Successful",
      description: `Application ${
        existingApplicationId ? "has been updated successfully" : "has been submitted successfully"
      }.`,
      variant: "default",
    });
    onApplicationSubmitted(data);
    handleCancel();
  } catch (error: any) {
    toast({
      title: "Error",
      description: error.message || "Submission failed.",
      variant: "destructive",
    });
  } finally {
    setIsSubmitting(false);
  }
};

  const renderStepContent = () => {
  switch (step) {
    case 1:
      return (
        <div className="space-y-6">
  <div className="bg-white p-6 rounded-lg border">
    <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setShowEstablishmentDetails(!showEstablishmentDetails)}>
      <h3 className="text-lg font-medium">ESTABLISHMENT DETAILS</h3>
      {showEstablishmentDetails ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
    </div>
    {showEstablishmentDetails && (
      <div className="grid grid-cols-4 gap-6">
        <div>
          <Label htmlFor="establishmentName" className="block mb-1 font-medium">
            Establishment Name <span className="text-red-500">*</span>
          </Label>
          <Select value={selectedEstablishmentId} onValueChange={handleEstablishmentChange}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select establishment" />
            </SelectTrigger>
            <SelectContent>
              {establishments.map((est) => (
                <SelectItem key={est.id} value={est.id}>{est.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.establishmentName && <p className="text-sm text-red-600 mt-1">{errors.establishmentName}</p>}
        </div>
        <div>
          <Label htmlFor="dti_number" className="block mb-1 font-medium">
            DTI Number <span className="text-red-500">*</span>
          </Label>
          <Input id="dti_number" value={formData.dti_number} readOnly placeholder="" className="h-10 bg-gray-100" />
          {errors.dti_number && <p className="text-sm text-red-600 mt-1">{errors.dti_number}</p>}
        </div>
        <div>
          <Label htmlFor="type" className="block mb-1 font-medium">
            Type <span className="text-red-500">*</span>
          </Label>
          <Input id="type" value={formData.type} readOnly placeholder="" className="h-10 bg-gray-100" />
        </div>
        <div>
          <Label htmlFor="occupancy" className="block mb-1 font-medium">
            Occupancy <span className="text-red-500">*</span>
          </Label>
          <Input id="occupancy" value={formData.occupancy} readOnly placeholder="" className="h-10 bg-gray-100" />
        </div>
        <div>
          <Label htmlFor="storeys" className="block mb-1 font-medium">
            Storeys <span className="text-red-500">*</span>
          </Label>
          <Input id="storeys" value={formData.storeys} readOnly placeholder="" className="h-10 bg-gray-100" />
        </div>
        <div>
          <Label htmlFor="floor_area" className="block mb-1 font-medium">
            Floor Area <span className="text-red-500">*</span>
          </Label>
          <Input id="floor_area" value={formData.floor_area} readOnly placeholder="" className="h-10 bg-gray-100" />
        </div>
        <div>
          <Label htmlFor="occupants" className="block mb-1 font-medium">
            Occupants <span className="text-red-500">*</span>
          </Label>
          <Input id="occupants" value={formData.occupants} readOnly placeholder="" className="h-10 bg-gray-100" />
        </div>
      </div>
    )}
  </div>
  <div className="bg-white p-6 rounded-lg border">
    <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setShowAddressDetails(!showAddressDetails)}>
      <h3 className="text-lg font-medium">ADDRESS DETAILS</h3>
      {showAddressDetails ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
    </div>
    {showAddressDetails && (
      <div className="grid grid-cols-4 gap-6">
        <div>
          <Label htmlFor="street" className="block mb-1 font-medium">
            Street <span className="text-red-500">*</span>
          </Label>
          <Input id="street" value={formData.street} readOnly placeholder="" className="h-10 bg-gray-100" />
          {errors.street && <p className="text-sm text-red-600 mt-1">{errors.street}</p>}
        </div>
        <div>
          <Label htmlFor="barangay" className="block mb-1 font-medium">
            Barangay <span className="text-red-500">*</span>
          </Label>
          <Input id="barangay" value={formData.barangay} readOnly placeholder="" className="h-10 bg-gray-100" />
          {errors.barangay && <p className="text-sm text-red-600 mt-1">{errors.barangay}</p>}
        </div>
        <div>
          <Label htmlFor="city" className="block mb-1 font-medium">
            City <span className="text-red-500">*</span>
          </Label>
          <Input id="city" value={formData.city} readOnly placeholder="" className="h-10 bg-gray-100" />
        </div>
        <div>
          <Label htmlFor="province" className="block mb-1 font-medium">
            Province <span className="text-red-500">*</span>
          </Label>
          <Input id="province" value={formData.province} readOnly placeholder="" className="h-10 bg-gray-100" />
        </div>
        <div>
          <Label htmlFor="region" className="block mb-1 font-medium">
            Region <span className="text-red-500">*</span>
          </Label>
          <Input id="region" value={formData.region} readOnly placeholder="" className="h-10 bg-gray-100" />
        </div>
        <div>
          <Label htmlFor="latitude" className="block mb-1 font-medium">
            Latitude <span className="text-red-500">*</span>
          </Label>
          <Input id="latitude" type="number" value={formData.latitude ?? ''} readOnly className="h-10 bg-gray-100" />
        </div>
        <div>
          <Label htmlFor="longitude" className="block mb-1 font-medium">
            Longitude <span className="text-red-500">*</span>
          </Label>
          <Input id="longitude" type="number" value={formData.longitude ?? ''} readOnly className="h-10 bg-gray-100" />
        </div>
      </div>
    )}
  </div>
  <div className="bg-white p-6 rounded-lg border">
    <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setShowOwnerDetails(!showOwnerDetails)}>
      <h3 className="text-lg font-medium">OWNER DETAILS</h3>
      {showOwnerDetails ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
    </div>
    {showOwnerDetails && (
      <div className="grid grid-cols-4 gap-6">
        <div>
          <Label htmlFor="owner_first_name" className="block mb-1 font-medium">
            First Name <span className="text-red-500">*</span>
          </Label>
          <Input id="owner_first_name" value={formData.owner_first_name} readOnly placeholder="" className="h-10 bg-gray-100" />
          {errors.owner_first_name && <p className="text-sm text-red-600 mt-1">{errors.owner_first_name}</p>}
        </div>
        <div>
          <Label htmlFor="owner_last_name" className="block mb-1 font-medium">
            Last Name <span className="text-red-500">*</span>
          </Label>
          <Input id="owner_last_name" value={formData.owner_last_name} readOnly placeholder="" className="h-10 bg-gray-100" />
          {errors.owner_last_name && <p className="text-sm text-red-600 mt-1">{errors.owner_last_name}</p>}
        </div>
        <div>
          <Label htmlFor="owner_middle_name" className="block mb-1 font-medium">
            Middle Name <span className="text-red-500">*</span>
          </Label>
          <Input id="owner_middle_name" value={formData.owner_middle_name} readOnly placeholder="" className="h-10 bg-gray-100" />
        </div>
        <div>
          <Label htmlFor="owner_suffix" className="block mb-1 font-medium">
            Suffix <span className="text-red-500">*</span>
          </Label>
          <Input id="owner_suffix" value={formData.owner_suffix} readOnly placeholder="" className="h-10 bg-gray-100" />
        </div>
        <div>
          <Label htmlFor="owner_email" className="block mb-1 font-medium">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="owner_email"
            value={formData.owner_email}
            onChange={(e) => setFormData({ ...formData, owner_email: e.target.value || '' })}
            placeholder=""
            className="h-10 bg-gray-100"
            readOnly
          />
          {errors.owner_email && <p className="text-sm text-red-600 mt-1">{errors.owner_email}</p>}
        </div>
        <div>
          <Label htmlFor="owner_mobile" className="block mb-1 font-medium">
            Mobile <span className="text-red-500">*</span>
          </Label>
          <Input
            id="owner_mobile"
            value={formData.owner_mobile}
            onChange={(e) => setFormData({ ...formData, owner_mobile: e.target.value || '' })}
            placeholder=""
            className="h-10 bg-gray-100"
            readOnly
          />
          {errors.owner_mobile && <p className="text-sm text-red-600 mt-1">{errors.owner_mobile}</p>}
        </div>
        <div>
          <Label htmlFor="owner_landline" className="block mb-1 font-medium">
            Landline <span className="text-red-500">*</span>
          </Label>
          <Input
            id="owner_landline"
            value={formData.owner_landline}
            onChange={(e) => setFormData({ ...formData, owner_landline: e.target.value || '' })}
            placeholder=""
            className="h-10 bg-gray-100"
            readOnly
          />
        </div>
      </div>
    )}
  </div>
  <div className="bg-white p-6 rounded-lg border">
    <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => setShowRepDetails(!showRepDetails)}>
      <h3 className="text-lg font-medium">REPRESENTATIVE DETAILS (OPTIONAL)</h3>
      {showRepDetails ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
    </div>
    {showRepDetails && (
      <div className="grid grid-cols-4 gap-6">
        <div>
          <Label htmlFor="rep_first_name" className="block mb-1 font-medium">
            First Name
          </Label>
          <Input id="rep_first_name" value={formData.rep_first_name} readOnly placeholder="" className="h-10 bg-gray-100" />
        </div>
        <div>
          <Label htmlFor="rep_last_name" className="block mb-1 font-medium">
            Last Name
          </Label>
          <Input id="rep_last_name" value={formData.rep_last_name} readOnly placeholder="" className="h-10 bg-gray-100" />
        </div>
        <div>
          <Label htmlFor="rep_middle_name" className="block mb-1 font-medium">
            Middle Name
          </Label>
          <Input id="rep_middle_name" value={formData.rep_middle_name} readOnly placeholder="" className="h-10 bg-gray-100" />
        </div>
        <div>
          <Label htmlFor="rep_suffix" className="block mb-1 font-medium">
            Suffix
          </Label>
          <Input id="rep_suffix" value={formData.rep_suffix} readOnly placeholder="" className="h-10 bg-gray-100" />
        </div>
        <div>
          <Label htmlFor="rep_email" className="block mb-1 font-medium">
            Email
          </Label>
          <Input
            id="rep_email"
            value={formData.rep_email}
            onChange={(e) => setFormData({ ...formData, rep_email: e.target.value || '' })}
            placeholder=""
            className="h-10 bg-gray-100"
            readOnly
          />
        </div>
        <div>
          <Label htmlFor="rep_mobile" className="block mb-1 font-medium">
            Mobile
          </Label>
          <Input
            id="rep_mobile"
            value={formData.rep_mobile}
            onChange={(e) => setFormData({ ...formData, rep_mobile: e.target.value || '' })}
            placeholder=""
            className="h-10 bg-gray-100"
            readOnly
          />
        </div>
        <div>
          <Label htmlFor="rep_landline" className="block mb-1 font-medium">
            Landline
          </Label>
          <Input
            id="rep_landline"
            value={formData.rep_landline}
            onChange={(e) => setFormData({ ...formData, rep_landline: e.target.value || '' })}
            placeholder=""
            className="h-10 bg-gray-100"
            readOnly
          />
        </div>
      </div>
    )}
  </div>
  <div className="bg-white p-6 rounded-lg border">
    <h3 className="text-lg font-medium mb-4">APPLICATION INFORMATION</h3>
    <div className="grid grid-cols-4 gap-6">
      <div className="col-span-2">
        <Label htmlFor="certificationType" className="block mb-1 font-medium">
          Certification Type <span className="text-red-500">*</span>
        </Label>
        <Select value={certificationType} onValueChange={(value) => setCertificationType(value as CertificationType)}>
          <SelectTrigger className="h-10">
            <SelectValue placeholder="Select certification type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FSEC">Fire Safety Evaluation Clearance</SelectItem>
            <SelectItem value="FSIC-Occupancy">Fire Safety Inspection Certificate (Occupancy)</SelectItem>
            <SelectItem value="FSIC-Business">Fire Safety Inspection Certificate (Business)</SelectItem>
          </SelectContent>
        </Select>
        {errors.certificationType && <p className="text-sm text-red-600 mt-1">{errors.certificationType}</p>}
      </div>
      {certificationType === 'FSEC' && (
        <div>
          <Label htmlFor="contractorName" className="block mb-1 font-medium">
            Contractor Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="contractorName"
            value={formData.contractorName}
            onChange={(e) => setFormData({ ...formData, contractorName: e.target.value.replace(/[^a-zA-Z\s]/g, '') })}
            placeholder="Enter contractor name"
            className="h-10"
          />
          {errors.contractorName && <p className="text-sm text-red-600 mt-1">{errors.contractorName}</p>}
        </div>
      )}
      {certificationType === 'FSIC-Occupancy' && (
        <div>
          <Label htmlFor="fsecNumber" className="block mb-1 font-medium">
            FSEC Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fsecNumber"
            value={formData.fsecNumber}
            onChange={(e) => setFormData({ ...formData, fsecNumber: e.target.value.replace(/\D/g, '').slice(0, 9) })}
            placeholder="Enter FSEC number"
            className="h-10"
          />
          {errors.fsecNumber && <p className="text-sm text-red-600 mt-1">{errors.fsecNumber}</p>}
        </div>
      )}
      {certificationType === 'FSIC-Business' && (
        <div>
          <Label htmlFor="occupancyPermitNo" className="block mb-1 font-medium">
            Occupancy Permit Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="occupancyPermitNo"
            value={formData.occupancyPermitNo}
            onChange={(e) => setFormData({ ...formData, occupancyPermitNo: e.target.value.replace(/\D/g, '').slice(0, 9) })}
            placeholder="Enter occupancy permit no."
            className="h-10"
          />
          {errors.occupancyPermitNo && <p className="text-sm text-red-600 mt-1">{errors.occupancyPermitNo}</p>}
        </div>
      )}
      {certificationType === 'FSIC-Business' && (
        <div>
          <Label className="block mb-1 font-medium">
            Business Permit Status <span className="text-red-500">*</span>
          </Label>
          <RadioGroup
            value={businessStatus || ''}
            onValueChange={(value) => setBusinessStatus(value as 'New' | 'Renewal')}
            className="flex space-x-4 mt-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="New" id="new" />
              <Label htmlFor="new">New</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Renewal" id="renewal" />
              <Label htmlFor="renewal">Renewal</Label>
            </div>
          </RadioGroup>
          {errors.businessStatus && <p className="text-sm text-red-600 mt-1">{errors.businessStatus}</p>}
        </div>
      )}
    </div>
  </div>
</div>
      );
    case 2:
      const docKeyStep2 = certificationType === 'FSIC-Business' ? `FSIC-Business-${businessStatus}` : certificationType;
      return (
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-medium mb-4">UPLOAD DOCUMENTS</h3>
          <p className="text-sm text-gray-600 mb-4">Upload required documents (max 20MB).</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(documentRequirements[docKeyStep2] || []).map((doc) => {
              const key = doc.label.toLowerCase().replace(/[^a-z0-9]/g, '');
              const file = documents[key];
              const existingUrl = existingDocumentUrls[key];
              return (
                <div key={key} className="space-y-2">
                  <Label className="block mb-1 font-medium">
                    {doc.label} {doc.required && <span className="text-red-500">*</span>}
                  </Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="file"
                        accept="*/*" // Allow all file types
                        ref={(el) => (fileInputRefs.current[key] = el)}
                        onChange={handleFileChange(doc.label)}
                        className="h-10 hidden"
                        id={`file-${key}`}
                      />
                      <label
                        htmlFor={`file-${key}`}
                        className="flex items-center gap-2 p-2 bg-gray-100 rounded-md border border-gray-300 hover:bg-gray-200 cursor-pointer"
                      >
                        <span className="flex-shrink-0 p-1 bg-orange-500 text-white rounded-full">
                          <Upload className="h-4 w-4" />
                        </span>
                        <span className="text-sm text-gray-600 truncate">{file || existingUrl ? 'Replace File' : 'Choose File'}</span>
                      </label>
                    </div>
                    {(file || existingUrl) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(doc.label)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {(file || existingUrl) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span
                        className="underline text-blue-600 hover:text-blue-800 cursor-pointer truncate"
                        onClick={() => handleFilePreview(file || existingUrl)}
                      >
                        {file ? file.name : existingUrl.split('/').pop() || 'Existing Document'}
                      </span>
                      {file && <span>({Math.round(file.size / 1024)} KB)</span>}
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                  )}
                  {errors[key] && <p className="text-sm text-red-600 mt-1">{errors[key]}</p>}
                </div>
              );
            })}
          </div>
        </div>
      );
      case 3:
        const docKeyStep3 = certificationType === 'FSIC-Business' ? `FSIC-Business-${businessStatus}` : certificationType;
        const docList = documentRequirements[docKeyStep3] || [];
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-center">REVIEW YOUR SUBMISSION</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border">
                <h4 className="font-medium mb-4">ESTABLISHMENT DETAILS</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex"><dt className="font-medium w-1/3">Establishment Name:</dt><dd>{formData.establishmentName}</dd></div>
                  <div className="flex"><dt className="font-medium w-1/3">DTI Number:</dt><dd>{formData.dti_number}</dd></div>
                  <div className="flex"><dt className="font-medium w-1/3">Type:</dt><dd>{formData.type}</dd></div>
                  <div className="flex"><dt className="font-medium w-1/3">Occupancy:</dt><dd>{formData.occupancy}</dd></div>
                  <div className="flex"><dt className="font-medium w-1/3">Storeys:</dt><dd>{formData.storeys}</dd></div>
                  <div className="flex"><dt className="font-medium w-1/3">Floor Area:</dt><dd>{formData.floor_area}</dd></div>
                  <div className="flex"><dt className="font-medium w-1/3">Occupants:</dt><dd>{formData.occupants}</dd></div>
                </dl>
              </div>
              <div className="bg-white p-6 rounded-lg border">
                <h4 className="font-medium mb-4">ADDRESS DETAILS</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex"><dt className="font-medium w-1/3">Street:</dt><dd>{formData.street}</dd></div>
                  <div className="flex"><dt className="font-medium w-1/3">Barangay:</dt><dd>{formData.barangay}</dd></div>
                  <div className="flex"><dt className="font-medium w-1/3">City:</dt><dd>{formData.city}</dd></div>
                  <div className="flex"><dt className="font-medium w-1/3">Province:</dt><dd>{formData.province}</dd></div>
                  <div className="flex"><dt className="font-medium w-1/3">Region:</dt><dd>{formData.region}</dd></div>
                  <div className="flex"><dt className="font-medium w-1/3">Location:</dt><dd>{formData.latitude && formData.longitude ? `Lat ${formData.latitude.toFixed(3)}, Long ${formData.longitude.toFixed(3)}` : ''}</dd></div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg border">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">OWNER DETAILS</h4>
                  <Button variant="ghost" className="text-orange-500 hover:text-orange-600" size="sm" onClick={() => setStep(1)}>Edit</Button>
                </div>
                <dl className="space-y-2 text-sm">
                  <div className="flex"><dt className="font-medium w-1/3">Name:</dt><dd>{`${formData.owner_first_name} ${formData.owner_middle_name} ${formData.owner_last_name} ${formData.owner_suffix}`.trim()}</dd></div>
                  <div className="flex"><dt className="font-medium w-1/3">Email:</dt><dd>{formData.owner_email}</dd></div>
                  <div className="flex"><dt className="font-medium w-1/3">Mobile:</dt><dd>{formData.owner_mobile}</dd></div>
                  <div className="flex"><dt className="font-medium w-1/3">Landline:</dt><dd>{formData.owner_landline}</dd></div>
                </dl>
              </div>
              {(formData.rep_first_name !== '' || formData.rep_last_name !== '' || formData.rep_email !== '' || formData.rep_mobile !== '' || formData.rep_landline !== '') && (
                <div className="bg-white p-6 rounded-lg border">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium">REPRESENTATIVE DETAILS</h4>
                    <Button variant="ghost" className="text-orange-500 hover:text-orange-600" size="sm" onClick={() => setStep(1)}>Edit</Button>
                  </div>
                  <dl className="space-y-2 text-sm">
                    <div className="flex"><dt className="font-medium w-1/3">Name:</dt><dd>{`${formData.rep_first_name} ${formData.rep_middle_name} ${formData.rep_last_name} ${formData.rep_suffix}`.trim()}</dd></div>
                    <div className="flex"><dt className="font-medium w-1/3">Email:</dt><dd>{formData.rep_email}</dd></div>
                    <div className="flex"><dt className="font-medium w-1/3">Mobile:</dt><dt>{formData.rep_mobile}</dt></div>
                    <div className="flex"><dt className="font-medium w-1/3">Landline:</dt><dd>{formData.rep_landline}</dd></div>
                  </dl>
                </div>
              )}
              <div className="bg-white p-6 rounded-lg border">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">APPLICATION INFORMATION</h4>
                  <Button variant="ghost" className="text-orange-500 hover:text-orange-600" size="sm" onClick={() => setStep(1)}>Edit</Button>
                </div>
                <dl className="space-y-2 text-sm">
                  <div className="flex"><dt className="font-medium w-1/3">Certification Type:</dt><dd>{certificationType}</dd></div>
                  {certificationType === 'FSIC-Business' && <div className="flex"><dt className="font-medium w-1/3">Business Permit Status:</dt><dd>{businessStatus}</dd></div>}
                  {certificationType === 'FSEC' && <div className="flex"><dt className="font-medium w-1/3">Contractor Name:</dt><dd>{formData.contractorName || ''}</dd></div>}
                  {certificationType === 'FSIC-Occupancy' && <div className="flex"><dt className="font-medium w-1/3">FSEC Number:</dt><dd>{formData.fsecNumber || ''}</dd></div>}
                  {certificationType === 'FSIC-Business' && <div className="flex"><dt className="font-medium w-1/3">Occupancy Permit:</dt><dd>{formData.occupancyPermitNo || ''}</dd></div>}
                </dl>
              </div>
              <div className="bg-white p-6 rounded-lg border">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">UPLOADED DOCUMENTS</h4>
                  <Button variant="ghost" className="text-orange-500 hover:text-orange-600" size="sm" onClick={() => setStep(2)}>Edit</Button>
                </div>
                <dl className="space-y-2 text-sm">
                  {[...Object.entries(documents), ...Object.entries(existingDocumentUrls)].length ? (
                    [...Object.entries(documents), ...Object.entries(existingDocumentUrls)].map(([key, value], index) => {
                      const docLabel = docList.find(doc => doc.label.toLowerCase().replace(/[^a-z0-9]/g, '') === key)?.label || key;
                      return value && (
                        <div key={index} className="flex">
                          <dt className="font-medium w-1/3">{docLabel}:</dt>
                          <dd className="truncate">
                            {value instanceof File ? value.name : value.split('/').pop() || 'Existing Document'}
                          </dd>
                        </div>
                      );
                    }).filter(Boolean)
                  ) : (
                    <div className="flex"><dt className="font-medium w-1/3">Documents:</dt><dd>No documents uploaded</dd></div>
                  )}
                </dl>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg border">
              <h4 className="font-medium mb-4">CERTIFICATION</h4>
              <div className="flex items-start space-x-2">
                <Checkbox id="certification" checked={isCertified} onCheckedChange={(checked) => setIsCertified(checked === true)} />
                <Label htmlFor="certification" className="text-sm">
                  I certify that the information provided is accurate and complete. Providing false information may result in disqualification.
                </Label>
              </div>
            </div>
          </div>
        );
    }
  };

  if (isLoadingData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[1200px] max-w-[1200px] p-8 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <span className="ml-2 text-lg">Loading...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={isSubmitting ? undefined : handleCancel}>
      <DialogContent className="w-[1200px] max-w-[1200px] p-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">APPLICATION FORM: CERTIFICATION</DialogTitle>
          <div className="flex items-center justify-center gap-2 mt-4">
            {['Basic Information', 'Upload Documents', 'Review & Submit'].map((label, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step > index + 1 ? 'bg-primary text-white' : step === index + 1 ? 'bg-primary/20 text-primary' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
                <span className={`ml-2 text-sm ${step === index + 1 ? 'font-medium' : 'text-gray-500'}`}>{label}</span>
                {index < 2 && <div className="w-6 h-px bg-gray-300 mx-2" />}
              </div>
            ))}
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.file && <div className="bg-red-50 p-4 rounded-md text-red-600 text-sm">{errors.file}</div>}
          {renderStepContent()}
          <div className="flex items-center justify-between w-full mt-6">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              {step > 1 && (
                <Button type="button" variant="outline" onClick={handleBack} disabled={isSubmitting}>
                  Back
                </Button>
              )}
            </div>
            <div>
              {step < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting || (step === 1 && (!certificationType || (certificationType === 'FSIC-Business' && !businessStatus)))}
                >
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting || !isCertified}>
                  Submit
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}