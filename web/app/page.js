'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import VesselTable from '../components/VesselTable';
import { RISK_TIERS, riskTier } from '../lib/risk';

// Leaflet needs the browser window, so we disable server-side rendering for the map
const VesselMap = dynamic(() => import('../components/VesselMap'), {
  ssr: false,
  loading: () => <div className="h-[480px] animate-pulse rounded-b-xl bg-neutral-100 dark:bg-neutral-900" />,
});

const REFRESH_INTERVAL_MS = 30_000;

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
        {value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-neutral-400">{hint}</div>}
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="h-3 w-16 rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="mt-2 h-7 w-10 rounded bg-neutral-200 dark:bg-neutral-800" />
    </div>
  );
}

export default function Home() {
  const [data, setData] = useState(null);
  const [selectedMmsi, setSelectedMmsi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');

  const load = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/vessels', { cache: 'no-store' });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
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
    // Defer past the current commit so the state updates inside load() don't
    // happen synchronously within the effect body itself.
    queueMicrotask(() => load());
    const id = setInterval(() => load({ silent: true }), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load]);

  const vessels = useMemo(() => data?.vessels ?? [], [data]);

  const stats = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 };
    for (const v of vessels) counts[riskTier(v.score).key]++;
    return counts;
  }, [vessels]);

  const filteredVessels = useMemo(() => {
    const term = search.trim();
    return vessels.filter((v) => {
      if (tierFilter !== 'all' && riskTier(v.score).key !== tierFilter) return false;
      if (term && !v.mmsi.includes(term)) return false;
      return true;
    });
  }, [vessels, search, tierFilter]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Maritime Anomaly Detector</h1>
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            {lastFetchedAt && <span>Updated {new Date(lastFetchedAt).toLocaleTimeString()}</span>}
            <button
              onClick={() => load({ silent: true })}
              disabled={refreshing}
              className="rounded-md border border-neutral-200 px-2 py-1 font-medium text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
            >
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Flagging vessels with suspicious AIS gaps or loitering behavior in the Singapore Strait
          {data?.windowHours ? ` · last ${data.windowHours}h` : ''}.
        </p>
      </header>

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          <span>Couldn&apos;t load vessel data: {error}</span>
          <button
            onClick={() => load()}
            className="shrink-0 rounded-md border border-red-300 px-2 py-1 font-medium hover:bg-red-100 dark:border-red-500/40 dark:hover:bg-red-500/20"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard label="Vessels tracked" value={data?.totalVesselsTracked ?? 0} />
            <StatCard label="Flagged" value={vessels.length} />
            <StatCard label="High risk" value={stats.high} hint={stats.high > 0 ? 'needs review' : undefined} />
            <StatCard label="Positions" value={data?.totalPositions ?? 0} hint={data?.windowHours ? `${data.windowHours}h window` : undefined} />
          </>
        )}
      </div>

      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <VesselMap vessels={vessels} selectedMmsi={selectedMmsi} onSelect={setSelectedMmsi} />

          <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <input
              type="text"
              inputMode="numeric"
              placeholder="Filter by MMSI…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-40 rounded-md border border-neutral-200 bg-transparent px-2.5 py-1.5 text-sm placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none dark:border-neutral-700"
            />
            <div className="flex items-center gap-1">
              {['all', ...RISK_TIERS.map((t) => t.key)].map((key) => (
                <button
                  key={key}
                  onClick={() => setTierFilter(key)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize transition ${
                    tierFilter === key
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
            {(search || tierFilter !== 'all') && (
              <span className="text-xs text-neutral-400">
                {filteredVessels.length} of {vessels.length} shown
              </span>
            )}
          </div>

          <VesselTable
            vessels={filteredVessels}
            selectedMmsi={selectedMmsi}
            onSelect={setSelectedMmsi}
            emptyMessage={
              vessels.length === 0
                ? data?.totalPositions === 0
                  ? 'No position data yet — waiting on the ingestion pipeline.'
                  : `All ${data?.totalVesselsTracked ?? 0} tracked vessels look normal — nothing flagged.`
                : 'No vessels match this filter.'
            }
          />
        </div>
      )}

      {loading && (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="h-[480px] animate-pulse bg-neutral-100 dark:bg-neutral-800" />
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
