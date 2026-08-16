// Category metadata for the landing page and dashboard filtering. Keys must
// match the vesselType values produced by ingestion (mockData.js / index.js).
export const CATEGORIES = [
  {
    key: 'cargo',
    label: 'Cargo & Container Traffic',
    description: 'Container ships and general cargo vessels transiting the strait.',
    icon: 'cargo',
  },
  {
    key: 'tanker',
    label: 'Tanker Traffic',
    description: 'Oil, chemical, and gas tankers — highest-consequence anomalies.',
    icon: 'tanker',
  },
  {
    key: 'cruise',
    label: 'Cruise & Passenger Vessels',
    description: 'Passenger ships and ferries operating in the strait.',
    icon: 'cruise',
  },
  {
    key: 'all',
    label: 'All Traffic',
    description: 'Every tracked vessel, unfiltered by type.',
    icon: 'all',
  },
];

export function categoryLabel(key) {
  return CATEGORIES.find((c) => c.key === key)?.label ?? 'Unknown';
}
