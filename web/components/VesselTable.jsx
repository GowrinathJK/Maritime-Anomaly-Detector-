'use client';

import { useMemo, useState } from 'react';
import { riskTier } from '../lib/risk';
import { useVesselData } from '../context/VesselDataContext';

const COLUMNS = [
  { key: 'mmsi', label: 'MMSI' },
  { key: 'score', label: 'Risk' },
  { key: 'reasons', label: 'Reasons', sortable: false },
];

export default function VesselTable({ vessels, selectedMmsi, onSelect, emptyMessage }) {
  const { unseenMmsis } = useVesselData();
  const [sortKey, setSortKey] = useState('score');
  const [sortDir, setSortDir] = useState('desc');

  const sortedVessels = useMemo(() => {
    const sorted = [...vessels].sort((a, b) => {
      if (sortKey === 'mmsi') return a.mmsi.localeCompare(b.mmsi);
      return a.score - b.score;
    });
    if (sortDir === 'desc') sorted.reverse();
    return sorted;
  }, [vessels, sortKey, sortDir]);

  function handleSort(key) {
    if (key === sortKey) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  if (vessels.length === 0) {
    return (
      <div className="px-4 py-10 text-center text-sm text-[var(--color-text-muted)]">
        {emptyMessage ?? 'No vessels to show.'}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] text-left">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                onClick={col.sortable === false ? undefined : () => handleSort(col.key)}
                className={`px-4 py-2.5 font-medium text-[var(--color-text-muted)] ${
                  col.sortable === false ? '' : 'cursor-pointer select-none hover:text-[var(--color-text)]'
                }`}
              >
                {col.label}
                {sortKey === col.key ? (
                  <span className="ml-1 text-[var(--color-text-muted)]">{sortDir === 'asc' ? '▲' : '▼'}</span>
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedVessels.map((v) => {
            const tier = riskTier(v.score);
            const isSelected = v.mmsi === selectedMmsi;
            const isNew = unseenMmsis.has(v.mmsi);
            return (
              <tr
                key={v.mmsi}
                onClick={() => onSelect(isSelected ? null : v.mmsi)}
                className={`cursor-pointer border-b border-[var(--color-border)] last:border-0 ${
                  isSelected ? 'bg-[var(--color-accent)]/10' : 'hover:bg-[var(--color-surface-hover)]'
                } ${isNew ? 'flash-new' : ''}`}
              >
                <td className="px-4 py-2.5 font-mono text-[var(--color-text)]">
                  <div className="flex items-center gap-2">
                    {v.mmsi}
                    {isNew && (
                      <span className="rounded bg-[var(--color-accent)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-accent-foreground)]">
                        NEW
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${tier.badgeClass}`}
                  >
                    {tier.label} · {v.score}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-[var(--color-text-muted)]">
                  <div className="flex flex-wrap gap-1.5">
                    {v.reasons.map((r, i) => (
                      <span
                        key={i}
                        className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5 text-xs"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
