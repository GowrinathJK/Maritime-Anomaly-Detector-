'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icons (a common Leaflet + bundler quirk)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function riskColor(score) {
  if (score >= 30) return 'red';
  if (score >= 15) return 'orange';
  return 'gold';
}

export default function VesselMap({ vessels, selectedMmsi }) {
  const center = [1.15, 103.8]; // Singapore Strait

  return (
    <MapContainer center={center} zoom={10} style={{ height: '500px', width: '100%', borderRadius: '8px' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {vessels.map((v) => (
        <Marker key={v.mmsi} position={[v.lastPosition.lat, v.lastPosition.lon]}>
          <Popup>
            <strong>MMSI: {v.mmsi}</strong><br />
            Risk score: {v.score}<br />
            {v.reasons.map((r, i) => <div key={i}>{r}</div>)}
          </Popup>
        </Marker>
      ))}
      {vessels
        .filter((v) => v.mmsi === selectedMmsi)
        .map((v) => (
          <Polyline
            key={v.mmsi}
            positions={v.track.map((p) => [p.lat, p.lon])}
            color={riskColor(v.score)}
          />
        ))}
    </MapContainer>
  );
}