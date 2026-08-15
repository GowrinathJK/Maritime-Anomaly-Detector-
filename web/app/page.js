'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import VesselTable from '../components/VesselTable';

// Leaflet needs the browser window, so we disable server-side rendering for the map
const VesselMap = dynamic(() => import('../components/VesselMap'), { ssr: false });

export default function Home() {
  const [vessels, setVessels] = useState([]);
  const [selectedMmsi, setSelectedMmsi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/vessels')
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setVessels(data.vessels);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Maritime Anomaly Detector</h1>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>
        Flagging vessels with suspicious AIS gaps or loitering behavior in the Singapore Strait.
      </p>

      {loading && <p>Loading vessel data...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {!loading && !error && vessels.length === 0 && (
        <p>No flagged vessels yet. Data will appear here once positions are ingested.</p>
      )}

      {!loading && !error && vessels.length > 0 && (
        <>
          <VesselMap vessels={vessels} selectedMmsi={selectedMmsi} />
          <VesselTable vessels={vessels} selectedMmsi={selectedMmsi} onSelect={setSelectedMmsi} />
        </>
      )}
    </main>
  );
}