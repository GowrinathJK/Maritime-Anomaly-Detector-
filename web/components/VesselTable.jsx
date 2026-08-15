'use client';

import { useMemo, useState } from 'react';
import { riskTier } from '../lib/risk';

const COLUMNS = [
  { key: 'mmsi', label: 'MMSI' },
  { key: 'score', label: 'Risk' },
  { key: 'reasons', label: 'Reasons', sortable: false },
];

export default function VesselTable({ vessels, selectedMmsi, onSelect, emptyMessage }) {
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
      <div className="px-4 py-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
        {emptyMessage ?? 'No vessels to show.'}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left dark:border-neutral-800">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                onClick={col.sortable === false ? undefined : () => handleSort(col.key)}
                className={`px-4 py-2.5 font-medium text-neutral-500 dark:text-neutral-400 ${
                  col.sortable === false ? '' : 'cursor-pointer select-none hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                {col.label}
                {sortKey === col.key ? (
                  <span className="ml-1 text-neutral-400">{sortDir === 'asc' ? '▲' : '▼'}</span>
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedVessels.map((v) => {
            const tier = riskTier(v.score);
            const isSelected = v.mmsi === selectedMmsi;
            return (
              <tr
                key={v.mmsi}
                onClick={() => onSelect(isSelected ? null : v.mmsi)}
                className={`cursor-pointer border-b border-neutral-100 last:border-0 dark:border-neutral-900 ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-500/10'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/60'
                }`}
              >
                <td className="px-4 py-2.5 font-mono text-neutral-800 dark:text-neutral-200">{v.mmsi}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${tier.badgeClass}`}
                  >
                    {tier.label} · {v.score}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-neutral-600 dark:text-neutral-400">
                  <div className="flex flex-wrap gap-1.5">
                    {v.reasons.map((r, i) => (
                      <span
                        key={i}
                        className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs dark:bg-neutral-800"
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
