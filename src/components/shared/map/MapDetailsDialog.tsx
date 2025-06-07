import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, User, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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

// Define Establishment type based on establishments table
interface Establishment {
  id: string;
  name: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  type: string | null;
  dti_number: string | null;
  owner_id: string | null;
}

// Define Owner type for fetched owner details
interface Owner {
  first_name: string | null;
  middle_name?: string | null;
  last_name: string | null;
  email: string | null;
  phone_number?: string | null;
}

interface MapDetailsDialogProps {
  establishment: Establishment | null;
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

export const MapDetailsDialog: React.FC<MapDetailsDialogProps> = ({
  establishment,
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const [owner, setOwner] = useState<Owner | null>(null);
  const [loadingOwner, setLoadingOwner] = useState(false);
  const mapRef = useRef<L.Map | null>(null); // Reference for map reset

  useEffect(() => {
    const fetchOwnerDetails = async () => {
      if (!establishment || !establishment.owner_id || !open) {
        console.log('Skipping fetch: No establishment or owner_id', { establishment, open });
        setOwner(null);
        return;
      }

      try {
        setLoadingOwner(true);
        console.log('Fetching owner with ID:', establishment.owner_id);
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, email, phone_number')
          .eq('id', establishment.owner_id)
          .single();

        if (error) {
          console.error('Supabase error:', error);
          throw new Error(`Failed to fetch owner: ${error.message}`);
        }

        if (!data) {
          console.warn('No owner data found for ID:', establishment.owner_id);
          setOwner(null);
          return;
        }

        console.log('Fetched owner data:', data);
        setOwner(data as Owner);
      } catch (err: any) {
        console.error('Error fetching owner details:', err);
        setOwner(null);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: err.message || 'Failed to fetch owner details. Please try again.',
        });
      } finally {
        setLoadingOwner(false);
      }
    };

    fetchOwnerDetails();
  }, [establishment, open, toast]);

  // Reset map view to initial coordinates and zoom
  const resetMapView = () => {
    if (mapRef.current && establishment?.latitude && establishment?.longitude) {
      mapRef.current.setView([establishment.latitude, establishment.longitude], 18);
    }
  };

  if (!establishment) return null;

  const renderStatusBadge = (status: string) => {
    const badgeStyles = {
      registered: 'bg-green-100 text-green-800 hover:bg-green-200',
      pending: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
      rejected: 'bg-red-100 text-red-800 hover:bg-red-200',
      default: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    };

    const style = badgeStyles[status.toLowerCase() as keyof typeof badgeStyles] || badgeStyles.default;
    return (
      <Badge className={cn(style, 'transition-colors duration-200 font-medium px-3 py-1')}>
        {status.charAt(0).toUpperCase() + status.slice(1) || 'N/A'}
      </Badge>
    );
  };

  const ownerName = owner
    ? [
        owner.first_name,
        owner.middle_name,
        owner.last_name,
      ].filter(Boolean).join(' ') || 'N/A'
    : loadingOwner
    ? 'Loading...'
    : 'N/A';

  const hasValidCoordinates = establishment.latitude != null && establishment.longitude != null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'w-[1200px] max-w-[1200px] p-8 bg-white border border-orange-200 rounded-xl shadow-2xl z-[1000]',
          'overflow-y-auto max-h-[90vh] animate-in fade-in duration-300'
        )}
        aria-labelledby="map-details-title"
      >
        <DialogHeader className="border-b border-gray-100 pb-4">
          <DialogTitle id="map-details-title" className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Building2 className="h-7 w-7 text-orange-600" />
            {establishment.name || 'Establishment Details'}
          </DialogTitle>
          <p className="text-gray-500 text-sm mt-2">Complete details for this establishment</p>
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
                <p className="text-sm font-medium text-gray-700">Name</p>
                <p className="text-sm text-gray-600">{establishment.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">DTI Number</p>
                <p className="text-sm text-gray-600">{establishment.dti_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Type</p>
                <p className="text-sm text-gray-600">{establishment.type || 'N/A'}</p>
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
                <p className="text-sm font-medium text-gray-700">Address</p>
                <p className="text-sm text-gray-600">{establishment.address || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Coordinates</p>
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
                <div className="flex items-center">
                  <p className="text-sm text-gray-600">{ownerName}</p>
                  {loadingOwner && <Loader2 className="ml-2 h-4 w-4 animate-spin text-orange-600" />}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Email</p>
                <p className="text-sm text-gray-600">{owner?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Mobile</p>
                <p className="text-sm text-gray-600">{owner?.phone_number || 'N/A'}</p>
              </div>
            </div>
          </div>
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