import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Leaflet + React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const createMarkerIcon = (color) => {
  return L.divIcon({
    className: 'custom-pin',
    html: `<div style="
      background-color: ${color};
      width: 20px;
      height: 20px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid white;
      box-shadow: 0 0 10px rgba(0,0,0,0.5);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 20],
    popupAnchor: [0, -20]
  });
};

const redIcon = createMarkerIcon('#ef4444'); // Tailwind red-500
const blueIcon = createMarkerIcon('#3b82f6'); // Tailwind blue-500

const RecenterMap = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position && position[0] !== 0) {
      map.flyTo(position, 15, {
        animate: true,
        duration: 1.5
      });
    }
  }, [position, map]);
  return null;
};

const Map = ({ position, otherPosition, path = [] }) => {
  const center = position || [20.5937, 78.9629]; // Default to India center

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative bg-dark-lighter">
      <MapContainer center={center} zoom={15} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        
        {position && (
          <Marker position={position} icon={redIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        {otherPosition && (
          <Marker position={otherPosition} icon={blueIcon}>
            <Popup>Sharer's location</Popup>
          </Marker>
        )}

        {path.length > 0 && (
          <Polyline positions={path} color="#3b82f6" weight={4} opacity={0.6} />
        )}

        <RecenterMap position={position || otherPosition} />
      </MapContainer>
      
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <div className="bg-dark/80 backdrop-blur-md p-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-white/10">
          Live Tracking Active
        </div>
      </div>
    </div>
  );
};

export default Map;
