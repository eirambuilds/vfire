import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Establishment } from '@/types/inspection';
import {
  Building2,
  Calendar,
  MapPin,
  FileText,
  User,
  AlertCircle,
  Download,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { jsPDF } from 'jspdf';
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

interface EstablishmentDetailsDialogProps {
  establishment: Establishment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  getOwnerName?: (owner_id: string) => string;
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
      <DialogContent className="sm:max-w-[425px]">
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

// Component to handle map centering
const MapController: React.FC<{ latitude: number; longitude: number }> = ({ latitude, longitude }) => {
  const map = useMap();

  React.useEffect(() => {
    map.setView([latitude, longitude], 18);
    map.invalidateSize(); // Ensure proper rendering in dialog
  }, [latitude, longitude, map]);

  return null;
};

export function EstablishmentDetailsDialog({
  establishment,
  open,
  onOpenChange,
  getOwnerName,
}: EstablishmentDetailsDialogProps) {
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

  // Reference to the map instance for reset functionality
  const mapRef = React.useRef<L.Map | null>(null);

  // Reset map view to initial coordinates and zoom
  const resetMapView = () => {
    if (mapRef.current && establishment?.latitude && establishment?.longitude) {
      mapRef.current.setView([establishment.latitude, establishment.longitude], 18);
    }
  };

  if (!establishment) return null;

  const renderStatusBadge = (status: string) => {
    const badgeStyles = {
      registered: "bg-green-100 text-green-800 hover:bg-green-200",
      pre_registered: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      unregistered: "bg-amber-100 text-amber-800 hover:bg-amber-200",
      default: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    };

    const style = badgeStyles[status as keyof typeof badgeStyles] || badgeStyles.default;
    return (
      <Badge className={cn(style, "transition-colors duration-200 font-medium px-3 py-1")}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ') || 'N/A'}
      </Badge>
    );
  };

  const handleDownloadPDF = async () => {
    try {
      if (establishment.registration_pdf_path) {
        // Download existing PDF from Supabase storage
        const { data, error } = await supabase.storage
          .from('registration-documents')
          .download(establishment.registration_pdf_path);

        if (error) throw error;

        const url = window.URL.createObjectURL(data);
        window.open(url, '_blank');
        return;
      }

      // Generate new PDF with jsPDF
      const doc = new jsPDF();
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const lineHeight = 10;
      const sectionSpacing = 15;
      const maxY = pageHeight - margin; // Bottom margin

      let y = 30;

      // Helper function to check and add new page if needed
      const checkPage = (requiredHeight: number) => {
        if (y + requiredHeight > maxY) {
          doc.addPage();
          y = margin;
        }
      };

      // Helper function to add section
      const addSection = (title: string, fields: { label: string; value: string }[]) => {
        // Estimate height for section
        const titleHeight = lineHeight;
        const fieldsHeight = fields.length * lineHeight;
        checkPage(titleHeight + fieldsHeight + sectionSpacing);

        doc.setFont("helvetica", "bold");
        doc.text(title, margin, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        fields.forEach(({ label, value }) => {
          // Split long text to fit within page width
          const lines = doc.splitTextToSize(`${label}: ${value || 'N/A'}`, 170);
          checkPage(lines.length * lineHeight);
          doc.text(lines, margin, y);
          y += lines.length * lineHeight;
        });
        y += sectionSpacing;
      };

      // Title
      doc.setFontSize(16);
      doc.text(`${establishment.name} - Registration Details`, margin, 20);
      doc.setFontSize(12);

      // Establishment Information
      addSection("Establishment Information", [
        { label: "DTI Certificate Number", value: establishment.dti_number },
        { label: "Type", value: establishment.type },
        { label: "Occupancy", value: establishment.occupancy },
        { label: "Number of Storeys", value: establishment.storeys?.toString() },
        { label: "Floor Area", value: establishment.floor_area ? `${establishment.floor_area} m²` : 'N/A' },
        { label: "Number of Occupants", value: establishment.occupants?.toString() },
        { label: "Status", value: establishment.status.charAt(0).toUpperCase() + establishment.status.slice(1).replace('_', ' ') },
      ]);

      // Address Information
      addSection("Address Information", [
        { label: "Full Address", value: establishment.address },
        { label: "Street", value: establishment.street },
        { label: "Barangay", value: establishment.barangay },
        { label: "City", value: establishment.city },
        { label: "Province", value: establishment.province },
        { label: "Region", value: establishment.region },
        { label: "Coordinates", value: establishment.latitude && establishment.longitude ? `Lat ${establishment.latitude.toFixed(8)}, Long ${establishment.longitude.toFixed(8)}` : 'N/A' },
      ]);

      // Owner Information
      addSection("Owner Information", [
        { label: "Name", value: `${establishment.owner_first_name} ${establishment.owner_middle_name || ''} ${establishment.owner_last_name} ${establishment.owner_suffix || ''}`.trim() },
        { label: "Email", value: establishment.owner_email },
        { label: "Mobile", value: establishment.owner_mobile },
        { label: "Landline", value: establishment.owner_landline },
      ]);

      // Authorized Representative Information
      if (establishment.rep_first_name || establishment.rep_last_name) {
        addSection("Authorized Representative Information", [
          { label: "Name", value: `${establishment.rep_first_name || ''} ${establishment.rep_middle_name || ''} ${establishment.rep_last_name || ''} ${establishment.rep_suffix || ''}`.trim() },
          { label: "Email", value: establishment.rep_email },
          { label: "Mobile", value: establishment.rep_mobile },
          { label: "Landline", value: establishment.rep_landline },
        ]);
      }

      // Dates
      addSection("Dates", [
        { label: "Created At", value: establishment.created_at ? new Date(establishment.created_at).toLocaleDateString() : 'N/A' },
        { label: "Registered At", value: establishment.date_registered && establishment.status === 'registered' ? new Date(establishment.date_registered).toLocaleDateString() : 'N/A' },
      ]);

      // Rejection History
      if (establishment.rejection_history?.length > 0) {
        checkPage(lineHeight + sectionSpacing);
        doc.setFont("helvetica", "bold");
        doc.text("Rejection History", margin, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        establishment.rejection_history.forEach((entry, index) => {
          // Estimate height for rejection entry
          const reasonsHeight = entry.reasons.length > 0 ? entry.reasons.length * lineHeight : lineHeight;
          const notesLines = doc.splitTextToSize(`Notes: ${entry.notes || 'No additional notes'}`, 165);
          const notesHeight = notesLines.length * lineHeight;
          checkPage(lineHeight + reasonsHeight + notesHeight + lineHeight * 2);

          doc.text(`Rejection ${index + 1}: ${new Date(entry.timestamp).toLocaleString()}`, margin, y);
          y += lineHeight;
          if (entry.reasons.length > 0) {
            entry.reasons.forEach((reason, rIndex) => {
              const reasonLines = doc.splitTextToSize(`- ${reason}`, 165);
              checkPage(reasonLines.length * lineHeight);
              doc.text(reasonLines, margin + 5, y);
              y += reasonLines.length * lineHeight;
            });
          } else {
            doc.text("No reasons specified", margin + 5, y);
            y += lineHeight;
          }
          doc.text(notesLines, margin + 5, y);
          y += notesHeight + lineHeight;
        });
      }

      // Save and open PDF
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
    } catch (err) {
      console.error('PDF handling failed:', err);
      showNotification("Error", "Failed to generate or download PDF.", "destructive");
    }
  };

  // Check if coordinates are valid
  const hasValidCoordinates = establishment.latitude != null && establishment.longitude != null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            "w-[1200px] max-w-[1200px] p-8 bg-white border border-orange-200 rounded-xl shadow-2xl",
            "overflow-y-auto max-h-[90vh] animate-in fade-in duration-300"
          )}
        >
          <DialogHeader className="border-b border-gray-100 pb-4">
            <DialogTitle className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Building2 className="h-7 w-7 text-orange-600" />
              {establishment.name}
            </DialogTitle>
            <p className="text-gray-500 text-sm mt-2">Complete registration details for this establishment</p>
          </DialogHeader>

          <div className="space-y-6">
            {/* Establishment Information */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="h-6 w-6 text-orange-600" />
                Establishment Information
              </h3>
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-700">DTI Certificate Number</p>
                  <p className="text-sm text-gray-600">{establishment.dti_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Type</p>
                  <p className="text-sm text-gray-600">{establishment.type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Occupancy</p>
                  <p className="text-sm text-gray-600">{establishment.occupancy || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Number of Storeys</p>
                  <p className="text-sm text-gray-600">{establishment.storeys || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Floor Area</p>
                  <p className="text-sm text-gray-600">{establishment.floor_area ? `${establishment.floor_area} m²` : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Number of Occupants</p>
                  <p className="text-sm text-gray-600">{establishment.occupants || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Status</p>
                  {renderStatusBadge(establishment.status)}
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="h-6 w-6 text-orange-600" />
                Address Information
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-700">Full Address</p>
                  <p className="text-sm text-gray-600">{establishment.address || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mt-4">Coordinates</p>
                  <p className="text-sm text-gray-600">
                    {hasValidCoordinates
                      ? `Lat ${establishment.latitude!.toFixed(8)}, Long ${establishment.longitude!.toFixed(8)}`
                      : 'N/A'}
                  </p>
                </div>
                <div className="col-span-2">
                  {hasValidCoordinates ? (
                    <div>
                      <div style={{ height: '300px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                        <MapContainer
                          center={[establishment.latitude!, establishment.longitude!]}
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
                          <MapController latitude={establishment.latitude!} longitude={establishment.longitude!} />
                          <Marker
                            position={[establishment.latitude!, establishment.longitude!]}
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

            {/* Owner Information */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-6 w-6 text-orange-600" />
                Owner Information
              </h3>
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-700">Name</p>
                  <p className="text-sm text-gray-600">
                    {`${establishment.owner_first_name} ${establishment.owner_middle_name || ''} ${establishment.owner_last_name} ${establishment.owner_suffix || ''}`.trim() || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Email</p>
                  <p className="text-sm text-gray-600">{establishment.owner_email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Mobile</p>
                  <p className="text-sm text-gray-600">{establishment.owner_mobile || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Landline</p>
                  <p className="text-sm text-gray-600">{establishment.owner_landline || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Authorized Representative Information */}
            {(establishment.rep_first_name || establishment.rep_last_name) && (
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="h-6 w-6 text-orange-600" />
                  Authorized Representative Information
                </h3>
                <div className="grid grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Name</p>
                    <p className="text-sm text-gray-600">
                      {`${establishment.rep_first_name || ''} ${establishment.rep_middle_name || ''} ${establishment.rep_last_name || ''} ${establishment.rep_suffix || ''}`.trim() || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email</p>
                    <p className="text-sm text-gray-600">{establishment.rep_email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Mobile</p>
                    <p className="text-sm text-gray-600">{establishment.rep_mobile || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Landline</p>
                    <p className="text-sm text-gray-600">{establishment.rep_landline || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-6 w-6 text-orange-600" />
                Dates
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-700">Date Created</p>
                  <p className="text-sm text-gray-600">
                    {establishment.created_at
                      ? new Date(establishment.created_at).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Date Registered</p>
                  <p className="text-sm text-gray-600">
                    {establishment.status === 'registered' && establishment.date_registered
                      ? new Date(establishment.date_registered).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Rejection History */}
            {establishment.rejection_history?.length > 0 && (
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                  Rejection History
                </h3>
                <div className="space-y-6">
                  {establishment.rejection_history.map((entry, index) => (
                    <div key={index} className="border-l-2 border-red-200 pl-4">
                      <p className="text-sm font-medium text-gray-700">
                        Rejected on: {new Date(entry.timestamp).toLocaleString()}
                      </p>
                      {entry.reasons.length > 0 ? (
                        <ul className="list-disc pl-5 mt-2 text-sm text-gray-600">
                          {entry.reasons.map((reason, rIndex) => (
                            <li key={rIndex}>{reason}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-600 mt-2">No reasons specified</p>
                      )}
                      <p className="text-sm text-gray-600 mt-2">
                        Notes: {entry.notes && entry.notes.trim() !== '' ? entry.notes : 'No additional notes'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            {/* <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-6 w-6 text-orange-600" />
                Documents
              </h3>
              <Button
                variant="outline"
                size="lg"
                className="w-1/2 justify-start border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 transition-all duration-200 shadow-sm"
                onClick={handleDownloadPDF}
              >
                <Download className="h-4 w-4 mr-2" />
                View Registration Form (PDF)
              </Button>
            </div> */}
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