import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Inspection } from '@/types/inspection';
import { format } from 'date-fns';
import { FileText, Calendar, Clipboard, User, Building2, AlertCircle, FileText as FileTextIcon, MapPin, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import { MapContainer, TileLayer, Marker, useMap, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom red marker icon
const redMarkerIcon = new L.Icon({
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Define checklist type based on inspection_checklists table
interface InspectionChecklist {
  id: string;
  inspection_id: string;
  establishment_name: string;
  inspector_name: string;
  inspection_type: string;
  verification_type?: string;
  other_inspection_type?: string;
  fsccr_provided: string;
  fsmr_provided: string;
  exit_access_remarks?: string;
  exit_remarks?: string;
  exit_discharge_remarks?: string;
  signage_remarks?: string;
  hazard_remarks?: string;
  fire_protection_remarks?: string;
  defects_means_of_egress?: string;
  defects_signage?: string;
  defects_hazards?: string;
  defects_fire_protection?: string;
  general_remarks?: string;
  comply_defects: boolean;
  fire_safety_clearances: string[];
  pay_fire_code_fees: boolean;
  issuance_type?: string;
  images: string[];
  created_at: string;
}

// Extend Inspection type to include coordinates
interface EnhancedInspection extends Inspection {
  latitude?: number | null;
  longitude?: number | null;
}

interface InspectionDetailsDialogProps {
  inspection: Inspection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Component to handle map centering
const MapController: React.FC<{ latitude: number; longitude: number }> = ({ latitude, longitude }) => {
  const map = useMap();

  React.useEffect(() => {
    map.setView([latitude, longitude], 18);
    map.invalidateSize(); // Ensure proper rendering in dialog
  }, [latitude, longitude, map]);

  return null;
};

export const InspectionDetailsDialog: React.FC<InspectionDetailsDialogProps> = ({
  inspection,
  open,
  onOpenChange,
}) => {
  const [enhancedInspection, setEnhancedInspection] = useState<EnhancedInspection | null>(null);
  const [checklist, setChecklist] = useState<InspectionChecklist | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const { toast } = useToast();
  const mapRef = useRef<L.Map | null>(null); // Reference for map reset

  useEffect(() => {
    const fetchEnhancedInspectionData = async () => {
      if (!inspection || !open) {
        setEnhancedInspection(inspection);
        return;
      }

      let updatedInspection: EnhancedInspection = { ...inspection };

      // Fetch establishment details including coordinates
      if (!inspection.establishment_name || !inspection.establishmentType || !inspection.address || !updatedInspection.latitude || !updatedInspection.longitude) {
        const { data: establishment, error: estError } = await supabase
          .from('establishments')
          .select('name, type, address, latitude, longitude')
          .eq('id', inspection.establishment_id)
          .single();

        if (!estError && establishment) {
          updatedInspection = {
            ...updatedInspection,
            establishment_name: establishment.name || 'Unknown Establishment',
            establishmentType: establishment.type || 'N/A',
            address: establishment.address || 'N/A',
            latitude: establishment.latitude,
            longitude: establishment.longitude,
          };
        }
      }

      // Fetch inspector details if missing
      if (inspection.inspectorId && !inspection.inspector) {
        const { data: inspector, error: inspError } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', inspection.inspectorId)
          .single();

        if (!inspError && inspector) {
          updatedInspection.inspector = `${inspector.first_name || ''} ${inspector.last_name || ''}`.trim() || 'Assigned';
        }
      }

      // Ensure rejection_reasons is an array
      if (updatedInspection.rejection_reasons && !Array.isArray(updatedInspection.rejection_reasons)) {
        updatedInspection.rejection_reasons = [updatedInspection.rejection_reasons] as string[];
      }

      setEnhancedInspection(updatedInspection);
    };

    fetchEnhancedInspectionData();
  }, [inspection, open]);

  // Reset map view to initial coordinates and zoom
  const resetMapView = () => {
    if (mapRef.current && enhancedInspection?.latitude && enhancedInspection?.longitude) {
      mapRef.current.setView([enhancedInspection.latitude, enhancedInspection.longitude], 18);
    }
  };

  const generatePDF = (checklist: InspectionChecklist) => {
    try {
      const doc = new jsPDF();
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const lineHeight = 10;
      const sectionSpacing = 15;
      const maxY = pageHeight - margin;

      let y = 30;

      const checkPage = (requiredHeight: number) => {
        if (y + requiredHeight > maxY) {
          doc.addPage();
           y = margin;
        }
      };

      const addSection = (title: string, fields: { label: string; value: string }[]) => {
        const titleHeight = lineHeight;
        const fieldsHeight = fields.length * lineHeight;
        checkPage(titleHeight + fieldsHeight + sectionSpacing);

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
        y += sectionSpacing;
      };

      doc.setFontSize(16);
      doc.text(`${checklist.establishment_name || 'Inspection'} - Checklist Details`, margin, 20);
      doc.setFontSize(12);

      // Summary Section
      addSection('Summary', [
        { label: 'Inspector', value: checklist.inspector_name },
        { label: 'Completed', value: format(new Date(checklist.created_at), 'PPP p') },
        { label: 'Inspection Type', value: checklist.inspection_type },
        { label: 'Verification Type', value: checklist.verification_type || 'N/A' },
        { label: 'Other Inspection Type', value: checklist.other_inspection_type || 'N/A' },
        { label: 'FSCCR Provided', value: checklist.fsccr_provided },
        { label: 'FSMR Provided', value: checklist.fsmr_provided },
      ]);

      // Address Information with Coordinates
      addSection('Establishment Address Information', [
        { label: 'Address', value: enhancedInspection?.address || 'N/A' },
        { label: 'Coordinates', value: enhancedInspection?.latitude && enhancedInspection?.longitude ? `Lat ${enhancedInspection.latitude.toFixed(8)}, Long ${enhancedInspection.longitude.toFixed(8)}` : 'N/A' },
      ]);

      // Remarks Section
      addSection('Remarks', [
        { label: 'Exit Access', value: checklist.exit_access_remarks || 'No remarks' },
        { label: 'Exits', value: checklist.exit_remarks || 'No remarks' },
        { label: 'Exit Discharge', value: checklist.exit_discharge_remarks || 'No remarks' },
        { label: 'Signage', value: checklist.signage_remarks || 'No remarks' },
        { label: 'Hazards', value: checklist.hazard_remarks || 'No remarks' },
        { label: 'Fire Protection', value: checklist.fire_protection_remarks || 'No remarks' },
      ]);

      // Defects Section
      addSection('Defects', [
        { label: 'Means of Egress', value: checklist.defects_means_of_egress || 'None' },
        { label: 'Signage', value: checklist.defects_signage || 'None' },
        { label: 'Hazards', value: checklist.defects_hazards || 'None' },
        { label: 'Fire Protection', value: checklist.defects_fire_protection || 'None' },
      ]);

      // Recommendations Section
      addSection('Recommendations', [
        { label: 'Comply with Defects', value: checklist.comply_defects ? 'Yes' : 'No' },
        { label: 'Fire Safety Clearances', value: checklist.fire_safety_clearances.length > 0 ? checklist.fire_safety_clearances.join(', ') : 'None' },
        { label: 'Pay Fire Code Fees', value: checklist.pay_fire_code_fees ? 'Yes' : 'No' },
        { label: 'Issuance Type', value: checklist.issuance_type || 'N/A' },
      ]);

      // General Remarks
      checkPage(lineHeight + sectionSpacing);
      doc.setFont('helvetica', 'bold');
      doc.text('General Remarks', margin, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      const generalRemarks = checklist.general_remarks || 'No remarks';
      const splitGeneralRemarks = doc.splitTextToSize(generalRemarks, 170);
      doc.text(splitGeneralRemarks, margin, y);
      y += splitGeneralRemarks.length * lineHeight + sectionSpacing;

      // Images Section
      if (checklist.images.length > 0) {
        checkPage(lineHeight + sectionSpacing);
        doc.setFont('helvetica', 'bold');
        doc.text('Images', margin, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        checklist.images.forEach((url, index) => {
          const text = `Image ${index + 1}: ${url}`;
          const lines = doc.splitTextToSize(text, 170);
          checkPage(lines.length * lineHeight);
          doc.text(lines, margin, y);
          y += lines.length * lineHeight;
        });
      }

      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF.',
        variant: 'destructive',
      });
    }
  };

  const fetchInspectionResults = async () => {
    if (!inspection) return;

    setLoadingResults(true);

    try {
      const { data, error } = await supabase
        .from('inspection_checklists' as any)
        .select('*')
        .eq('inspection_id', inspection.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      if (data && data.length > 0) {
        // Ensure the object matches the InspectionChecklist interface
        const latestChecklist = data[0] as unknown as InspectionChecklist;
        setChecklist(latestChecklist);
        generatePDF(latestChecklist);
      } else {
        toast({
          title: 'Error',
          description: 'No checklist found for this inspection.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching inspection results:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch inspection results. Please try again.',
        variant: 'destructive',
      });
      setChecklist(null);
    } finally {
      setLoadingResults(false);
    }
  };

  if (!enhancedInspection) return null;

  const renderStatusBadge = (status: string) => {
    const badgeStyles = {
      pending: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
      scheduled: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      inspected: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
      approved: 'bg-green-100 text-green-800 hover:bg-green-200',
      rejected: 'bg-red-100 text-red-800 hover:bg-red-200',
      cancelled: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
      default: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    };

    const style = badgeStyles[status.toLowerCase() as keyof typeof badgeStyles] || badgeStyles.default;
    return (
      <Badge className={cn(style, 'transition-colors duration-200 font-medium px-3 py-1')}>
        {status.charAt(0).toUpperCase() + status.slice(1) || 'N/A'}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'PPP p');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const canViewResults = ['inspected', 'approved', 'rejected'].includes(enhancedInspection.status);
  const hasValidCoordinates = enhancedInspection.latitude != null && enhancedInspection.longitude != null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'w-[1200px] max-w-[1200px] p-8 bg-white border border-orange-200 rounded-xl shadow-2xl',
          'overflow-y-auto max-h-[90vh] animate-in fade-in duration-300'
        )}
        aria-labelledby="inspection-details-title"
      >
        <DialogHeader className="border-b border-gray-100 pb-4">
          <DialogTitle id="inspection-details-title" className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Building2 className="h-7 w-7 text-orange-600" />
            {enhancedInspection.establishment_name || 'Inspection Details'}
          </DialogTitle>
          <p className="text-gray-500 text-sm mt-2">Complete details for this inspection</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Inspection Information */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-6 w-6 text-orange-600" />
              Inspection Information
            </h3>
            <div className="grid grid-cols-4 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-700">Inspection ID</p>
                <p className="text-sm text-gray-600">{enhancedInspection.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Application Type</p>
                <p className="text-sm text-gray-600">{enhancedInspection.type || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Status</p>
                {renderStatusBadge(enhancedInspection.status)}
              </div>
            </div>
          </div>

          {/* Establishment Information */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="h-6 w-6 text-orange-600" />
              Establishment Information
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-700">Name</p>
                <p className="text-sm text-gray-600">{enhancedInspection.establishment_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Type</p>
                <p className="text-sm text-gray-600">{enhancedInspection.establishmentType || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Address</p>
                <p className="text-sm text-gray-600">{enhancedInspection.address || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Coordinates</p>
                <p className="text-sm text-gray-600">
                  {hasValidCoordinates
                    ? `Lat ${enhancedInspection.latitude!.toFixed(8)}, Long ${enhancedInspection.longitude!.toFixed(8)}`
                    : 'N/A'}
                </p>
              </div>
              <div className="col-span-2">
                {hasValidCoordinates ? (
                  <div>
                    <div style={{ height: '300px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                      <MapContainer
                        center={[enhancedInspection.latitude!, enhancedInspection.longitude!]}
                        zoom={18}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                        dragging={true}
                        touchZoom={true}
                        doubleClickZoom={true}
                        scrollWheelZoom={true}
                        boxZoom={true}
                        keyboard={true}
                        ref={mapRef}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <ZoomControl position="bottomright" />
                        <MapController latitude={enhancedInspection.latitude!} longitude={enhancedInspection.longitude!} />
                        <Marker
                          position={[enhancedInspection.latitude!, enhancedInspection.longitude!]}
                          icon={redMarkerIcon}
                          interactive={true}
                        />
                      </MapContainer>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetMapView}
                        className="bg-white border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 transition-all duration-200 shadow-sm"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset View
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    No valid coordinates available to display map
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Inspector Information */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-6 w-6 text-orange-600" />
              Inspector Information
            </h3>
            <div className="grid grid-cols-4 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-700">Name</p>
                <p className="text-sm text-gray-600">{enhancedInspection.inspector || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Rejection History */}
          {enhancedInspection.rejection_reasons?.length > 0 && (
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-red-600" />
                Rejection History
              </h3>
              <div className="space-y-6">
                <div className="border-l-2 border-red-200 pl-4">
                  <p className="text-sm font-medium text-gray-700">
                    Rejected on: {enhancedInspection.updated_at ? new Date(enhancedInspection.updated_at).toLocaleString() : 'N/A'}
                  </p>
                  {Array.isArray(enhancedInspection.rejection_reasons) && enhancedInspection.rejection_reasons.length > 0 ? (
                    <ul className="list-disc pl-5 mt-2 text-sm text-gray-600">
                      {enhancedInspection.rejection_reasons.map((reason, index) => (
                        <li key={index}>{reason}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-600 mt-2">No reasons specified</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Documents */}
          {canViewResults && (
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-6 w-6 text-orange-600" />
                Documents
              </h3>
              <Button
                variant="outline"
                size="lg"
                aria-label="View inspection checklist as PDF"
                className="w-1/2 justify-start border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 transition-all duration-200 shadow-sm"
                onClick={fetchInspectionResults}
                disabled={loadingResults}
              >
                <FileTextIcon className="h-4 w-4 mr-2" />
                {loadingResults ? 'Generating PDF...' : 'View Inspection Checklist (PDF)'}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-end gap-3 pt-6 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-white border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 transition-all duration-200 shadow-sm px-6 py-2"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};