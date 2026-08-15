'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { RISK_TIERS, riskTier } from '../lib/risk';

const SINGAPORE_STRAIT_CENTER = [1.15, 103.8];

function markerIcon(tier, isSelected) {
  const size = isSelected ? 22 : 15;
  return L.divIcon({
    className: '',
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:9999px;background:${tier.color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)${
      isSelected ? `,0 0 0 4px ${tier.color}55` : ''
    };"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

// Zoom/pan to fit all flagged vessels once, and again whenever the set of
// vessels changes — but not on every polling refresh, or the map would jump
// under the user's cursor every 30s.
function FitBoundsOnChange({ vessels }) {
  const map = useMap();
  const lastKey = useRef(null);

  useEffect(() => {
    if (vessels.length === 0) return;
    const key = vessels.map((v) => v.mmsi).sort().join(',');
    if (key === lastKey.current) return;
    lastKey.current = key;

    const bounds = L.latLngBounds(vessels.map((v) => [v.lastPosition.lat, v.lastPosition.lon]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 12 });
  }, [vessels, map]);

  return null;
}

function FlyToSelected({ vessel }) {
  const map = useMap();
  useEffect(() => {
    if (!vessel) return;
    map.flyTo([vessel.lastPosition.lat, vessel.lastPosition.lon], Math.max(map.getZoom(), 11), {
      duration: 0.6,
    });
  }, [vessel, map]);
  return null;
}

export default function VesselMap({ vessels, selectedMmsi, onSelect }) {
  const selectedVessel = vessels.find((v) => v.mmsi === selectedMmsi) ?? null;

  return (
    <div className="relative">
      <MapContainer
        center={SINGAPORE_STRAIT_CENTER}
        zoom={10}
        style={{ height: '480px', width: '100%' }}
        className="rounded-b-xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBoundsOnChange vessels={vessels} />
        <FlyToSelected vessel={selectedVessel} />

        {vessels.map((v) => {
          const tier = riskTier(v.score);
          const isSelected = v.mmsi === selectedMmsi;
          return (
            <Marker
              key={v.mmsi}
              position={[v.lastPosition.lat, v.lastPosition.lon]}
              icon={markerIcon(tier, isSelected)}
              eventHandlers={{ click: () => onSelect(v.mmsi) }}
              zIndexOffset={isSelected ? 1000 : 0}
            >
              <Popup>
                <div className="min-w-[180px] text-sm">
                  <div className="flex items-center justify-between gap-2 font-semibold">
                    <span className="font-mono">{v.mmsi}</span>
                    <span style={{ color: tier.color }}>{tier.label} · {v.score}</span>
                  </div>
                  <ul className="mt-1 list-disc pl-4 text-neutral-600">
                    {v.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                  <div className="mt-1 text-xs text-neutral-400">
                    Last seen {new Date(v.lastPosition.timestamp).toLocaleString()}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {selectedVessel && (
          <Polyline
            key={selectedVessel.mmsi}
            positions={selectedVessel.track.map((p) => [p.lat, p.lon])}
            pathOptions={{ color: riskTier(selectedVessel.score).color, weight: 3 }}
          />
        )}
      </MapContainer>

      <div className="absolute bottom-3 left-3 z-[1000] rounded-lg bg-white/90 px-3 py-2 text-xs shadow ring-1 ring-black/5 backdrop-blur dark:bg-neutral-900/90 dark:ring-white/10">
        <div className="mb-1 font-medium text-neutral-500 dark:text-neutral-400">Risk level</div>
        <div className="flex items-center gap-3">
          {RISK_TIERS.map((tier) => (
            <div key={tier.key} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: tier.color }}
              />
              <span className="text-neutral-700 dark:text-neutral-300">{tier.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
