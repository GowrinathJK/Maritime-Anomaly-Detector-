'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const VesselDataContext = createContext(null);

const REFRESH_INTERVAL_MS = 30_000;

export function VesselDataProvider({ children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);
  const [unseenMmsis, setUnseenMmsis] = useState(() => new Set());

  // Tracks which MMSIs were flagged as of the previous poll, purely to
  // detect newcomers — lives outside React state since it's never rendered.
  const knownFlaggedRef = useRef(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/vessels', { cache: 'no-store' });
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      const currentFlagged = new Set(json.vessels.map((v) => v.mmsi));
      if (knownFlaggedRef.current === null) {
        // First load of the session: establish the baseline without
        // flashing every pre-existing flag as "new".
        knownFlaggedRef.current = currentFlagged;
      } else {
        const newlyAppeared = [...currentFlagged].filter((m) => !knownFlaggedRef.current.has(m));
        knownFlaggedRef.current = currentFlagged;
        if (newlyAppeared.length > 0) {
          setUnseenMmsis((prev) => {
            const next = new Set([...prev].filter((m) => currentFlagged.has(m)));
            for (const m of newlyAppeared) next.add(m);
            return next;
          });
        } else {
          // Still prune anything that dropped off the flagged list.
          setUnseenMmsis((prev) => new Set([...prev].filter((m) => currentFlagged.has(m))));
        }
      }

      setData(json);
      setLastFetchedAt(Date.now());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => load());
    const id = setInterval(() => load({ silent: true }), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load]);

  const markAllSeen = useCallback(() => setUnseenMmsis(new Set()), []);

  const vessels = useMemo(() => data?.vessels ?? [], [data]);

  const notifications = useMemo(
    () => [...vessels].sort((a, b) => b.lastPosition.timestamp - a.lastPosition.timestamp),
    [vessels]
  );

  const flaggedCountByCategory = useCallback(
    (categoryKey) => {
      if (categoryKey === 'all') return vessels.length;
      return vessels.filter((v) => (v.lastPosition?.vesselType ?? 'unknown') === categoryKey).length;
    },
    [vessels]
  );

  const value = {
    vessels,
    notifications,
    unseenMmsis,
    markAllSeen,
    totalPositions: data?.totalPositions ?? 0,
    totalVesselsTracked: data?.totalVesselsTracked ?? 0,
    windowHours: data?.windowHours,
    loading,
    refreshing,
    error,
    lastFetchedAt,
    refresh: load,
    flaggedCountByCategory,
  };

  return <VesselDataContext.Provider value={value}>{children}</VesselDataContext.Provider>;
}

export function useVesselData() {
  const ctx = useContext(VesselDataContext);
  if (!ctx) throw new Error('useVesselData must be used within a VesselDataProvider');
  return ctx;
}
