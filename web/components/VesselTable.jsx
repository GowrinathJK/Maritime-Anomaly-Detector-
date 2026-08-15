'use client';

import { useMemo, useState } from 'react';

const COLUMNS = [
  { key: 'mmsi', label: 'MMSI' },
  { key: 'score', label: 'Risk Score' },
  { key: 'reasons', label: 'Reasons', sortable: false },
];

export default function VesselTable({ vessels, selectedMmsi, onSelect }) {
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

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
      <thead>
        <tr style={{ textAlign: 'left', borderBottom: '2px solid #ccc' }}>
          {COLUMNS.map((col) => (
            <th
              key={col.key}
              onClick={col.sortable === false ? undefined : () => handleSort(col.key)}
              style={{
                padding: '8px',
                cursor: col.sortable === false ? 'default' : 'pointer',
                userSelect: 'none',
              }}
            >
              {col.label}
              {sortKey === col.key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sortedVessels.map((v) => (
          <tr
            key={v.mmsi}
            onClick={() => onSelect(v.mmsi)}
            style={{
              cursor: 'pointer',
              backgroundColor: v.mmsi === selectedMmsi ? '#eef' : 'transparent',
              borderBottom: '1px solid #eee',
            }}
          >
            <td style={{ padding: '8px' }}>{v.mmsi}</td>
            <td style={{ padding: '8px', fontWeight: 'bold' }}>{v.score}</td>
            <td style={{ padding: '8px' }}>{v.reasons.join(' · ')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
