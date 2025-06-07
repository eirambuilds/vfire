import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Define Establishment type
interface Establishment {
  id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
}

// Props for the map component
interface LeafletMapProps {
  establishments: Establishment[];
}

import { useMap } from "react-leaflet";

const LeafletMap: React.FC<LeafletMapProps> = ({ establishments }) => {
  const defaultCenter = { lat: 14.6995, lng: 120.9812 }; // Default (Valenzuela)

  const SetViewOnClick = ({ coords }: { coords: { lat: number; lng: number } }) => {
    const map = useMap();
    map.setView(coords, 12);
    return null;
  };

  return (
    <MapContainer className="h-80 w-full rounded-lg shadow">
  <SetViewOnClick coords={defaultCenter} />
  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

  {establishments
    .filter(est => est.status === "registered" && est.latitude !== null && est.longitude !== null)
    .map((est) => (
      <Marker key={est.id} position={[est.latitude!, est.longitude!]}>
        <Popup>
          <strong>{est.name}</strong>
          <br />
          {est.address}
        </Popup>
      </Marker>
    ))}
</MapContainer>

  );
};

export default LeafletMap;