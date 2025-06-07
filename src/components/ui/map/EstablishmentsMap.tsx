import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface Establishment {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  status: string;
}

interface EstablishmentsMapProps {
  establishments: Establishment[];
  onMarkerClick: (establishment: Establishment) => void;
  selectedEstablishment: Establishment | null;
  statusColors: Record<string, string>;
}

const DEFAULT_CENTER: [number, number] = [14.7011, 120.9830];
const DEFAULT_ZOOM = 13;

const FitMapToBounds: React.FC<{
  locations: [number, number][];
  selectedEstablishment: Establishment | null;
}> = ({ locations, selectedEstablishment }) => {
  const map = useMap();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Filter valid locations
    const validLocations = locations.filter(
      ([lat, lng]) => !isNaN(lat) && !isNaN(lng) && lat !== null && lng !== null
    );

    console.log('FitMapToBounds - Locations:', validLocations);
    console.log('FitMapToBounds - Selected Establishment:', selectedEstablishment);

    if (selectedEstablishment && !isNaN(selectedEstablishment.latitude) && !isNaN(selectedEstablishment.longitude)) {
      map.flyTo([selectedEstablishment.latitude, selectedEstablishment.longitude], 15, {
        duration: 1,
      });
    } else if (validLocations.length > 0) {
      map.fitBounds(validLocations, { padding: [50, 50] });
    } else {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    }

    // Clear any existing timeout to prevent memory leaks
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Ensure the map container is mounted before calling invalidateSize
    if (map.getContainer()) {
      timeoutRef.current = setTimeout(() => {
        if (map.getContainer()) { // Double-check before calling
          map.invalidateSize();
        }
      }, 300);
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [locations, selectedEstablishment, map]);

  return null;
};

const EstablishmentsMap: React.FC<EstablishmentsMapProps> = ({
  establishments,
  onMarkerClick,
  selectedEstablishment,
  statusColors,
}) => {
  const mapRef = useRef<L.Map | null>(null);

  const createMarkerIcon = (status: string, isSelected: boolean) => {
    const color = statusColors[status] || 'gray'; // Fallback to gray
    const size = isSelected ? 50 : 40; // Larger pins: 40px regular, 50px selected
    const anchor = isSelected ? 25 : 20; // Center anchor for bottom of pin
    const circleSize = isSelected ? 12 : 10; // Larger circle for selected

    // SVG for a location pin shape, scaled for larger size
    const svgIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
        <path fill="${color}" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        <circle cx="12" cy="9" r="${circleSize / 4}" fill="white" stroke="${isSelected ? 'black' : color}" stroke-width="${isSelected ? 2 : 1}"/>
      </svg>
    `;

    return L.divIcon({
      html: svgIcon,
      className: isSelected ? 'selected-marker' : 'status-marker',
      iconSize: [size, size],
      iconAnchor: [anchor, size], // Anchor at bottom center
      popupAnchor: [0, -size], // Popup above pin
    });
  };

  return (
    <MapContainer
      ref={mapRef}
      className="h-full w-full z-10"
      style={{ height: "90%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <FitMapToBounds
        locations={establishments
          .filter(est => !isNaN(est.latitude) && !isNaN(est.longitude))
          .map(est => [est.latitude, est.longitude])}
        selectedEstablishment={selectedEstablishment}
      />
      {establishments
        .filter(est => !isNaN(est.latitude) && !isNaN(est.longitude))
        .map(est => (
          <Marker
            key={est.id}
            position={[est.latitude, est.longitude]}
            icon={createMarkerIcon(est.status, selectedEstablishment?.id === est.id)}
            eventHandlers={{
              click: () => {
                onMarkerClick(est);
              },
            }}
          />
        ))}
    </MapContainer>
  );
};

export default EstablishmentsMap;