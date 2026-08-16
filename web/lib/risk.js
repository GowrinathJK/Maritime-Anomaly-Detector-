// Shared risk-tier presentation: map a numeric score to a label/color used
// consistently by the map markers, table badges, notification bell, and legend.
//
// Colors are duplicated from the --color-risk-* tokens in globals.css rather
// than read via CSS var() — Leaflet writes marker/polyline colors as raw SVG
// attributes (not inline style), where var() resolution isn't reliable, so
// these need to be concrete values usable directly in JS/canvas/SVG.
export const RISK_TIERS = [
  {
    key: 'high',
    label: 'High',
    min: 30,
    color: '#f87171',
    badgeClass: 'bg-[#f87171]/10 text-[#f87171] ring-1 ring-inset ring-[#f87171]/30',
  },
  {
    key: 'medium',
    label: 'Medium',
    min: 15,
    color: '#fbbf24',
    badgeClass: 'bg-[#fbbf24]/10 text-[#fbbf24] ring-1 ring-inset ring-[#fbbf24]/30',
  },
  {
    key: 'low',
    label: 'Low',
    min: 0,
    color: '#60a5fa',
    badgeClass: 'bg-[#60a5fa]/10 text-[#60a5fa] ring-1 ring-inset ring-[#60a5fa]/30',
  },
];

export function riskTier(score) {
  return RISK_TIERS.find((tier) => score >= tier.min) ?? RISK_TIERS[RISK_TIERS.length - 1];
}
