import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Calendar,
  MapPin,
  FileText,
  User,
  AlertCircle,
  FileText as FileTextIcon,
  RefreshCw,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Application, BusinessStatus, Establishment } from '@/types/application';
import { supabase } from '@/integrations/supabase/client';
import { jsPDF } from 'jspdf';
import { useToast } from '@/hooks/use-toast';
import { MapContainer, TileLayer, Marker, useMap, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const redMarkerIcon = new L.Icon({
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/* BusinessStatus is now imported from '@/types/application' */

// Remove the local Establishment interface and use the one from Application
// interface Establishment { ... }

export interface ExtendedApplication extends Application {
  owner_first_name: string | null;
  owner_middle_name: string | null;
  owner_last_name: string | null;
  owner_suffix: string | null;
  owner_email: string | null;
  owner_mobile: string | null;
  owner_landline: string | null;
  rep_first_name: string | null;
  rep_middle_name: string | null;
  rep_last_name: string | null;
  rep_suffix: string | null;
  rep_email: string | null;
  rep_mobile: string | null;
  rep_landline: string | null;
  street: string | null;
  barangay: string | null;
  city: string | null;
  province: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  fsec_number: string | null;
  occupancy_permit_no: string | null;
  business_status: BusinessStatus | null;
  contractor_name: string | null;
  endorsement_obo: string | null;
  assessment_fee_occupancy: string | null;
  fire_safety_compliance_commissioning_report: string | null;
  architectural_documents: string | null;
  civil_structural_documents: string | null;
  mechanical_documents: string | null;
  electrical_documents: string | null;
  plumbing_documents: string | null;
  sanitary_documents: string | null;
  fire_protection_documents: string | null;
  electronics_documents: string | null;
  fire_safety_compliance_report: string | null;
  cost_estimates_signed_sealed: string | null;
  notarized_cost_estimates: string | null;
  certificate_of_completion: string | null;
  as_built_plan: string | null;
  fire_safety_evaluation_clearance: string | null;
  certificate_of_occupancy: string | null;
  affidavit_no_substantial_changes: string | null;
  business_permit_fee_assessment_new: string | null;
  fire_insurance_new: string | null;
  business_permit_fee_assessment_renewal: string | null;
  fire_safety_maintenance_report: string | null;
  fire_insurance_renewal: string | null;
  fire_safety_clearance_hot_work: string | null;
  establishments: Application['establishments'] | null;
}

interface ApplicationDetailsDialogProps {
  application: ExtendedApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MapController: React.FC<{ latitude: number; longitude: number }> = ({ latitude, longitude }) => {
  const map = useMap();
  React.useEffect(() => {
    map.setView([latitude, longitude], 18);
    map.invalidateSize();
  }, [latitude, longitude, map]);
  return null;
};

export const ApplicationDetailsDialog: React.FC<ApplicationDetailsDialogProps> = ({
  application,
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const [ownerName, setOwnerName] = useState<string>('No Owner');
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [documentFields, setDocumentFields] = useState<{ label: string; value: string }[]>([]);
  const [userRole, setUserRole] = useState<string>('owner');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const mapRef = React.useRef<L.Map | null>(null);

  const documentFieldsMap = [
    { label: 'Architectural Documents', key: 'architectural_documents' },
    { label: 'Civil/Structural Documents', key: 'civil_structural_documents' },
    { label: 'Mechanical Documents', key: 'mechanical_documents' },
    { label: 'Electrical Documents', key: 'electrical_documents' },
    { label: 'Plumbing Documents', key: 'plumbing_documents' },
    { label: 'Sanitary Documents', key: 'sanitary_documents' },
    { label: 'Fire Protection Documents', key: 'fire_protection_documents' },
    { label: 'Electronics Documents', key: 'electronics_documents' },
    { label: 'Fire Safety Compliance Report', key: 'fire_safety_compliance_report' },
    { label: 'Cost Estimates Signed and Sealed', key: 'cost_estimates_signed_sealed' },
    { label: 'Notarized Cost Estimates', key: 'notarized_cost_estimates' },
    { label: 'Endorsement from OBO', key: 'endorsement_obo' },
    { label: 'Certificate of Completion', key: 'certificate_of_completion' },
    { label: 'Assessment Fee for Occupancy', key: 'assessment_fee_occupancy' },
    { label: 'As Built Plan', key: 'as_built_plan' },
    { label: 'Fire Safety Compliance and Commissioning Report', key: 'fire_safety_compliance_commissioning_report' },
    { label: 'Fire Safety Evaluation Clearance', key: 'fire_safety_evaluation_clearance' },
    { label: 'Certificate of Occupancy', key: 'certificate_of_occupancy' },
    { label: 'Affidavit of No Substantial Changes', key: 'affidavit_no_substantial_changes' },
    { label: 'Business Permit Fee Assessment (New)', key: 'business_permit_fee_assessment_new' },
    { label: 'Fire Insurance (New)', key: 'fire_insurance_new' },
    { label: 'Business Permit Fee Assessment (Renewal)', key: 'business_permit_fee_assessment_renewal' },
    { label: 'Fire Safety Maintenance Report', key: 'fire_safety_maintenance_report' },
    { label: 'Fire Insurance (Renewal)', key: 'fire_insurance_renewal' },
    { label: 'Fire Safety Clearance for Hot Work', key: 'fire_safety_clearance_hot_work' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        setCurrentUserId(user.id);

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profileError) throw new Error(profileError.message);
        setUserRole(profileData?.role || user.user_metadata?.role || 'owner');

        if (!application || !application.id) {
          setOwnerName('No Owner');
          setEstablishment(null);
          setDocumentFields([]);
          return;
        }

        const { data: appData, error: appError } = await supabase
          .from('applications')
          .select(`
            id,
            type,
            status,
            business_status,
            contractor_name,
            fsec_number,
            occupancy_permit_no,
            owner_first_name,
            owner_middle_name,
            owner_last_name,
            owner_suffix,
            owner_email,
            owner_mobile,
            owner_landline,
            rep_first_name,
            rep_middle_name,
            rep_last_name,
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
            longitude,
            submitted_at,
            updated_at,
            rejection_reasons,
            rejection_notes,
            certificate_url,
            architectural_documents,
            civil_structural_documents,
            mechanical_documents,
            electrical_documents,
            plumbing_documents,
            sanitary_documents,
            fire_protection_documents,
            electronics_documents,
            fire_safety_compliance_report,
            cost_estimates_signed_sealed,
            notarized_cost_estimates,
            endorsement_obo,
            certificate_of_completion,
            assessment_fee_occupancy,
            as_built_plan,
            fire_safety_compliance_commissioning_report,
            fire_safety_evaluation_clearance,
            certificate_of_occupancy,
            affidavit_no_substantial_changes,
            business_permit_fee_assessment_new,
            fire_insurance_new,
            business_permit_fee_assessment_renewal,
            fire_safety_maintenance_report,
            fire_insurance_renewal,
            fire_safety_clearance_hot_work,
            establishments (
              id,
              name,
              dti_number,
              type,
              occupancy,
              storeys,
              floor_area,
              occupants,
              address
            )
          `)
          .eq('id', application.id)
          .single() as { data: ExtendedApplication | null; error: any };

        if (appError || !appData) throw new Error(appError?.message || 'No data');

        const ownerParts = [
          appData.owner_first_name,
          appData.owner_middle_name,
          appData.owner_last_name,
          appData.owner_suffix,
        ].filter(Boolean);
        setOwnerName(ownerParts.length ? ownerParts.join(' ') : 'No Owner');
        setEstablishment(appData.establishments || null);
        setDocumentFields(
          documentFieldsMap
            .map(({ label, key }) => {
              let rawValue = appData[key as keyof ExtendedApplication];
              let value: string;
              if (rawValue == null) {
                value = '';
              } else if (typeof rawValue === 'string') {
                value = rawValue;
              } else if (typeof rawValue === 'number') {
                value = rawValue.toString();
              } else if (Array.isArray(rawValue)) {
                value = rawValue.join(', ');
              } else if (typeof rawValue === 'object') {
                value = JSON.stringify(rawValue);
              } else {
                value = String(rawValue);
              }
              return { label, value };
            })
            .filter(doc => doc.value)
        );
      } catch (err: any) {
        console.error('Error:', err.message);
        toast({ title: 'Error', description: 'Failed to fetch details.', variant: 'destructive' });
        setOwnerName('No Owner');
        setEstablishment(null);
        setDocumentFields([]);
      }
    };

    if (open && application) fetchData();
  }, [open, application, toast]);

  const resetMapView = () => {
    if (mapRef.current && application?.latitude && application?.longitude) {
      mapRef.current.setView([application.latitude, application.longitude], 18);
    }
  };

  if (!application) return null;

  const showBusinessStatus = application.type === 'FSIC-Business';
  const showContractorName = application.type === 'FSEC';
  const showFSECNumber = application.type === 'FSIC-Occupancy';
  const showOccupancyPermitNumber = application.type === 'FSIC-Business';
  const hasValidCoordinates = application.latitude != null && application.longitude != null;
  const canViewCertificate =
    application.certificate_url && application.status === 'approved' && (userRole === 'admin' || application.owner_id === currentUserId);

  const renderStatusBadge = (status: string) => {
    const badgeStyles = {
      pending: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
      approved: 'bg-green-100 text-green-800 hover:bg-green-200',
      rejected: 'bg-red-100 text-red-800 hover:bg-red-200',
      default: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    };
    const style = badgeStyles[status.toLowerCase() as keyof typeof badgeStyles] || badgeStyles.default;
    return <Badge className={cn(style, 'px-3 py-1')}>{status.charAt(0).toUpperCase() + status.slice(1) || 'N/A'}</Badge>;
  };

  const shortenUrl = (url: string) => url.length > 50 ? `${url.substring(0, 30)}...${url.substring(url.length - 20)}` : url;

  const handleViewPDF = async () => {
    try {
      const doc = new jsPDF();
      let y = 30;
      const margin = 20;
      const lineHeight = 10;
      const maxY = doc.internal.pageSize.height - margin;

      const checkPage = (requiredHeight: number) => {
        if (y + requiredHeight > maxY) {
          doc.addPage();
          y = margin;
        }
      };

      const addSection = (title: string, fields: { label: string; value: string }[]) => {
        checkPage(lineHeight + fields.length * lineHeight + 15);
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        fields.forEach(({ label, value }) => {
          const lines = doc.splitTextToSize(`${label}: ${value || 'N/A'}`, 170);
          checkPage(lines.length * lineHeight);
          doc.text(lines, margin, y);
          y += lines.length * lineHeight;
        });
        y += 15;
      };

      doc.setFontSize(16);
      doc.text(`${establishment?.name || application.establishments?.name || 'Application'} - Details`, margin, 20);
      doc.setFontSize(12);

      addSection('Application Information', [
        { label: 'Type', value: application.type },
        ...(showBusinessStatus ? [{ label: 'Business Permit Status', value: application.business_status || 'N/A' }] : []),
        { label: 'Status', value: application.status.charAt(0).toUpperCase() + application.status.slice(1) },
        ...(showContractorName ? [{ label: 'Contractor Name', value: application.contractor_name || 'N/A' }] : []),
        ...(showFSECNumber ? [{ label: 'FSEC Number', value: application.fsec_number || 'N/A' }] : []),
        ...(showOccupancyPermitNumber ? [{ label: 'Occupancy Permit Number', value: application.occupancy_permit_no || 'N/A' }] : []),
      ]);

      addSection('Establishment Information', [
        { label: 'Name', value: establishment?.name || application.establishments?.name || 'N/A' },
        { label: 'DTI Number', value: establishment?.dti_number || application.establishments?.dti_number || 'N/A' },
        { label: 'Type', value: establishment?.type || application.establishments?.type || 'N/A' },
        { label: 'Occupancy', value: establishment?.occupancy || application.establishments?.occupancy || 'N/A' },
        { label: 'Number of Storeys', value: (establishment?.storeys || application.establishments?.storeys || 'N/A').toString() },
        { label: 'Floor Area', value: establishment?.floor_area ? `${establishment.floor_area} m²` : application.establishments?.floor_area ? `${application.establishments.floor_area} m²` : 'N/A' },
        { label: 'Number of Occupants', value: (establishment?.occupants || application.establishments?.occupants || 'N/A').toString() },
      ]);

      addSection('Address Information', [
        { label: 'Full Address', value: establishment?.address || application.establishments?.address || 'N/A' },
        { label: 'Street', value: application.street || 'N/A' },
        { label: 'Barangay', value: application.barangay || 'N/A' },
        { label: 'City', value: application.city || 'N/A' },
        { label: 'Province', value: application.province || 'N/A' },
        { label: 'Region', value: application.region || 'N/A' },
        { label: 'Coordinates', value: application.latitude && application.longitude ? `Lat ${application.latitude.toFixed(8)}, Long ${application.longitude.toFixed(8)}` : 'N/A' },
      ]);

      addSection('Owner Information', [
        { label: 'Name', value: ownerName },
        { label: 'Email', value: application.owner_email || 'N/A' },
        { label: 'Mobile', value: application.owner_mobile || 'N/A' },
        { label: 'Landline', value: application.owner_landline || 'N/A' },
      ]);

      const repName = [application.rep_first_name, application.rep_middle_name, application.rep_last_name, application.rep_suffix].filter(Boolean).join(' ').trim() || 'N/A';
      const repFields = [
        { label: 'Name', value: repName },
        { label: 'Email', value: application.rep_email || 'N/A' },
        { label: 'Mobile', value: application.rep_mobile || 'N/A' },
        { label: 'Landline', value: application.rep_landline || 'N/A' },
      ];
      if (repFields.some(field => field.value !== 'N/A')) {
        addSection('Authorized Representative Information', repFields);
      }

      addSection('Dates', [
        { label: 'Submitted At', value: application.submitted_at ? new Date(application.submitted_at).toLocaleDateString() : 'N/A' },
        { label: 'Updated At', value: application.updated_at ? new Date(application.updated_at).toLocaleDateString() : 'N/A' },
      ]);

      if (application.rejection_reasons?.length) {
        checkPage(lineHeight + 15);
        doc.setFont('helvetica', 'bold');
        doc.text('Rejection History', margin, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        application.rejection_reasons.forEach((reason, index) => {
          const timestamp = application.updated_at || application.submitted_at;
          const notesLines = doc.splitTextToSize(`Notes: ${application.rejection_notes || 'No notes'}`, 165);
          checkPage(lineHeight * (2 + notesLines.length));
          doc.text(`Rejection ${index + 1}: ${timestamp ? new Date(timestamp).toLocaleString() : 'N/A'}`, margin, y);
          y += lineHeight;
          doc.text(`- ${reason}`, margin + 5, y);
          y += lineHeight;
          if (index === application.rejection_reasons.length - 1) {
            doc.text(notesLines, margin + 5, y);
            y += notesLines.length * lineHeight;
          }
        });
      }

      const pdfBlob = doc.output('blob');
      window.open(URL.createObjectURL(pdfBlob), '_blank');
    } catch (err) {
      console.error('PDF error:', err);
      toast({ title: 'Error', description: 'Failed to generate PDF.', variant: 'destructive' });
    }
  };

  const handleViewCertificate = () => {
    if (application.certificate_url) window.open(application.certificate_url, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[1200px] max-w-[1200px] p-8 bg-white border border-orange-200 rounded-xl shadow-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader className="border-b border-gray-100 pb-4">
          <DialogTitle className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Building2 className="h-7 w-7 text-orange-600" />
            {establishment?.name || application.establishments?.name || 'Application Details'}
          </DialogTitle>
          <p className="text-gray-500 text-sm mt-2">Complete details for this certification application</p>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-6 w-6 text-orange-600" />
              Application Information
            </h3>
            <div className="grid grid-cols-4 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-700">Type</p>
                <p className="text-sm text-gray-600">{application.type || 'N/A'}</p>
              </div>
              {showBusinessStatus && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Business Permit Status</p>
                  <p className="text-sm text-gray-600">{application.business_status || 'N/A'}</p>
                </div>
              )}
              {showContractorName && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Contractor Name</p>
                  <p className="text-sm text-gray-600">{application.contractor_name || 'N/A'}</p>
                </div>
              )}
              {showFSECNumber && (
                <div>
                  <p className="text-sm font-medium text-gray-700">FSEC Number</p>
                  <p className="text-sm text-gray-600">{application.fsec_number || 'N/A'}</p>
                </div>
              )}
              {showOccupancyPermitNumber && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Occupancy Permit Number</p>
                  <p className="text-sm text-gray-600">{application.occupancy_permit_no || 'N/A'}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-700">Status</p>
                {renderStatusBadge(application.status)}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="h-6 w-6 text-orange-600" />
              Establishment Information
            </h3>
            <div className="grid grid-cols-4 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-700">Name</p>
                <p className="text-sm text-gray-600">{establishment?.name || application.establishments?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">DTI Number</p>
                <p className="text-sm text-gray-600">{establishment?.dti_number || application.establishments?.dti_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Type</p>
                <p className="text-sm text-gray-600">{establishment?.type || application.establishments?.type || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Occupancy</p>
                <p className="text-sm text-gray-600">{establishment?.occupancy || application.establishments?.occupancy || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Number of Storeys</p>
                <p className="text-sm text-gray-600">{establishment?.storeys || application.establishments?.storeys || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Floor Area</p>
                <p className="text-sm text-gray-600">{establishment?.floor_area ? `${establishment.floor_area} m²` : application.establishments?.floor_area ? `${application.establishments.floor_area} m²` : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Number of Occupants</p>
                <p className="text-sm text-gray-600">{establishment?.occupants || application.establishments?.occupants || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-6 w-6 text-orange-600" />
              Address Information
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-700">Full Address</p>
                <p className="text-sm text-gray-600">{establishment?.address || application.establishments?.address || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Coordinates</p>
                <p className="text-sm text-gray-600">
                  {hasValidCoordinates ? `Lat ${application.latitude!.toFixed(8)}, Long ${application.longitude!.toFixed(8)}` : 'N/A'}
                </p>
              </div>
              <div className="col-span-2">
                {hasValidCoordinates ? (
                  <div>
                    <div style={{ height: '300px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                      <MapContainer
                        center={[application.latitude!, application.longitude!]}
                        zoom={18}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                        ref={mapRef}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        />
                        <ZoomControl position="bottomright" />
                        <MapController latitude={application.latitude!} longitude={application.longitude!} />
                        <Marker position={[application.latitude!, application.longitude!]} icon={redMarkerIcon} />
                      </MapContainer>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetMapView}
                        className="border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset View
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    No valid coordinates
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-6 w-6 text-orange-600" />
              Owner Information
            </h3>
            <div className="grid grid-cols-4 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-700">Name</p>
                <p className="text-sm text-gray-600">{ownerName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Email</p>
                <p className="text-sm text-gray-600">{application.owner_email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Mobile</p>
                <p className="text-sm text-gray-600">{application.owner_mobile || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Landline</p>
                <p className="text-sm text-gray-600">{application.owner_landline || 'N/A'}</p>
              </div>
            </div>
          </div>

          {(() => {
            const repName = [application.rep_first_name, application.rep_middle_name, application.rep_last_name, application.rep_suffix].filter(Boolean).join(' ').trim() || 'N/A';
            const repFields = [
              { label: 'Name', value: repName },
              { label: 'Email', value: application.rep_email || 'N/A' },
              { label: 'Mobile', value: application.rep_mobile || 'N/A' },
              { label: 'Landline', value: application.rep_landline || 'N/A' },
            ];
            return repFields.some(field => field.value !== 'N/A') ? (
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="h-6 w-6 text-orange-600" />
                  Authorized Representative Information
                </h3>
                <div className="grid grid-cols-4 gap-6">
                  {repFields.map((field, index) => (
                    <div key={index}>
                      <p className="text-sm font-medium text-gray-700">{field.label}</p>
                      <p className="text-sm text-gray-600">{field.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-orange-600" />
              Dates
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-700">Date Submitted</p>
                <p className="text-sm text-gray-600">{application.submitted_at ? new Date(application.submitted_at).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Date Updated</p>
                <p className="text-sm text-gray-600">{application.updated_at ? new Date(application.updated_at).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-6 w-6 text-orange-600" />
              Uploaded Documents
            </h3>
            <div className="grid grid-cols-2 gap-6">
              {documentFields.length ? (
                documentFields.map((doc, index) => (
                  <div key={index}>
                    <p className="text-sm font-medium text-gray-700">{doc.label}</p>
                    <p className="text-sm text-gray-600">
                      <a href={doc.value} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">
                        {shortenUrl(doc.value)}
                      </a>
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600">No documents available</p>
              )}
            </div>
          </div>

          {application.rejection_reasons?.length ? (
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-red-600" />
                Rejection History
              </h3>
              <div className="border-l-2 border-red-200 pl-4">
                <p className="text-sm font-medium text-gray-700">
                  Rejected on: {(application.updated_at || application.submitted_at) ? new Date(application.updated_at || application.submitted_at).toLocaleString() : 'N/A'}
                </p>
                {application.rejection_reasons.length ? (
                  <ul className="list-disc pl-5 mt-2 text-sm text-gray-600">
                    {application.rejection_reasons.map((reason, rIndex) => (
                      <li key={rIndex}>{reason}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600 mt-2">No reasons specified</p>
                )}
                <p className="text-sm text-gray-600 mt-2">
                  Notes: {application.rejection_notes && application.rejection_notes.trim() !== '' ? application.rejection_notes : 'No notes'}
                </p>
              </div>
            </div>
          ) : null}

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-6 w-6 text-orange-600" />
              Documents
            </h3>
            <div className="flex flex-col gap-4">
              <Button
                variant="outline"
                size="lg"
                className="w-full justify-start border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                onClick={handleViewPDF}
              >
                <FileTextIcon className="h-4 w-4 mr-2" />
                View Application Form (PDF)
              </Button>
              {canViewCertificate && (
                <Button
                  variant="default"
                  size="lg"
                  className="w-full justify-start bg-orange-600 text-white hover:bg-orange-700"
                  onClick={handleViewCertificate}
                >
                  <Download className="h-4 w-4 mr-2" />
                  View Certificate
                </Button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-3 pt-6 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 px-6 py-2"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};