import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';

const createMarkerIcon = (color, pulse = false) =>
  L.divIcon({
    className: 'custom-pin',
    html: `<div style="
      background-color: ${color};
      width: 18px; height: 18px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 0 ${pulse ? '6px' : '4px'} ${color}55;
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -12],
  });

const myIcon = createMarkerIcon('#22c55e', true);   // green - me
const sharerIcon = createMarkerIcon('#3b82f6', true); // blue - sharer

const RecenterMap = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 15, { animate: true, duration: 1.5 });
  }, [position, map]);
  return null;
};

const OSRM_PROFILES = {
  driving: 'driving',
  cycling: 'cycling',
  walking: 'foot',
};

const fetchRoute = async (from, to, mode) => {
  const profile = OSRM_PROFILES[mode] || 'driving';
  const url = `https://router.project-osrm.org/route/v1/${profile}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.routes?.[0]) {
    return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  }
  return null;
};

const ROUTE_COLORS = {
  driving: '#f59e0b',
  cycling: '#10b981',
  walking: '#a78bfa',
};

const Map = ({ position, otherPosition, path = [], routeMode = 'driving', showRoute = false }) => {
  const center = position || otherPosition || [20.5937, 78.9629];
  const [routeCoords, setRouteCoords] = useState(null);

  useEffect(() => {
    if (!showRoute || !position || !otherPosition) {
      setRouteCoords(null);
      return;
    }
    fetchRoute(position, otherPosition, routeMode).then(setRouteCoords);
  }, [position, otherPosition, routeMode, showRoute]);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative bg-dark-lighter">
      <MapContainer center={center} zoom={15} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {position && (
          <Marker position={position} icon={myIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        {otherPosition && (
          <Marker position={otherPosition} icon={sharerIcon}>
            <Popup>Sharer's location</Popup>
          </Marker>
        )}

        {/* Live path trail */}
        {path.length > 1 && (
          <Polyline positions={path} color="#3b82f6" weight={3} opacity={0.4} dashArray="6 6" />
        )}

        {/* Route line */}
        {routeCoords && (
          <Polyline positions={routeCoords} color={ROUTE_COLORS[routeMode]} weight={5} opacity={0.8} />
        )}

        <RecenterMap position={otherPosition || position} />
      </MapContainer>
    </div>
  );
};

export default Map;
