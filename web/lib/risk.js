// Shared risk-tier presentation: map a numeric score to a label/color used
// consistently by the map markers, table badges, and legend.
export const RISK_TIERS = [
  {
    key: 'high',
    label: 'High',
    min: 30,
    color: '#dc2626',
    badgeClass: 'bg-red-500/10 text-red-700 ring-1 ring-inset ring-red-600/20 dark:text-red-400 dark:ring-red-500/30',
  },
  {
    key: 'medium',
    label: 'Medium',
    min: 15,
    color: '#ea580c',
    badgeClass: 'bg-orange-500/10 text-orange-700 ring-1 ring-inset ring-orange-600/20 dark:text-orange-400 dark:ring-orange-500/30',
  },
  {
    key: 'low',
    label: 'Low',
    min: 0,
    color: '#ca8a04',
    badgeClass: 'bg-yellow-500/10 text-yellow-700 ring-1 ring-inset ring-yellow-600/20 dark:text-yellow-400 dark:ring-yellow-500/30',
  },
];

export function riskTier(score) {
  return RISK_TIERS.find((tier) => score >= tier.min) ?? RISK_TIERS[RISK_TIERS.length - 1];
}
