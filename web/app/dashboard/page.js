'use client';

import { Suspense, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import VesselTable from '../../components/VesselTable';
import { useVesselData } from '../../context/VesselDataContext';
import { RISK_TIERS, riskTier } from '../../lib/risk';
import { CATEGORIES, categoryLabel } from '../../lib/categories';

const VesselMap = dynamic(() => import('../../components/VesselMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[480px] animate-pulse rounded-b-xl bg-[var(--color-surface-hover)]" />
  ),
});

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
      <div className="text-xs font-medium text-[var(--color-text-muted)]">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">{hint}</div>}
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
      <div className="h-3 w-16 rounded bg-[var(--color-surface-hover)]" />
      <div className="mt-2 h-7 w-10 rounded bg-[var(--color-surface-hover)]" />
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get('category') ?? 'all';

  const {
    vessels,
    totalVesselsTracked,
    totalPositions,
    windowHours,
    loading,
    refreshing,
    error,
    lastFetchedAt,
    refresh,
  } = useVesselData();

  const [selectedMmsi, setSelectedMmsi] = useState(null);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');

  const categoryVessels = useMemo(() => {
    if (category === 'all') return vessels;
    return vessels.filter((v) => (v.lastPosition?.vesselType ?? 'unknown') === category);
  }, [vessels, category]);

  const stats = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 };
    for (const v of categoryVessels) counts[riskTier(v.score).key]++;
    return counts;
  }, [categoryVessels]);

  const filteredVessels = useMemo(() => {
    const term = search.trim();
    return categoryVessels.filter((v) => {
      if (tierFilter !== 'all' && riskTier(v.score).key !== tierFilter) return false;
      if (term && !v.mmsi.includes(term)) return false;
      return true;
    });
  }, [categoryVessels, search, tierFilter]);

  function setCategory(key) {
    setSelectedMmsi(null);
    router.push(key === 'all' ? '/dashboard' : `/dashboard?category=${key}`);
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{categoryLabel(category)}</h1>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Suspicious AIS gaps or loitering behavior in the Singapore Strait
              {windowHours ? ` · last ${windowHours}h` : ''}.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
            {lastFetchedAt && <span>Updated {new Date(lastFetchedAt).toLocaleTimeString()}</span>}
            <button
              onClick={() => refresh({ silent: true })}
              disabled={refreshing}
              className="rounded-md border border-[var(--color-border)] px-2 py-1 font-medium transition hover:bg-[var(--color-surface-hover)] disabled:opacity-50"
            >
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                category === c.key
                  ? 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </header>

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-[#f87171]/30 bg-[#f87171]/10 px-4 py-3 text-sm text-[#f87171]">
          <span>Couldn&apos;t load vessel data: {error}</span>
          <button
            onClick={() => refresh()}
            className="shrink-0 rounded-md border border-[#f87171]/40 px-2 py-1 font-medium hover:bg-[#f87171]/10"
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
            <StatCard label="Vessels tracked" value={category === 'all' ? totalVesselsTracked : '—'} hint={category !== 'all' ? 'category-scoped' : undefined} />
            <StatCard label="Flagged" value={categoryVessels.length} />
            <StatCard label="High risk" value={stats.high} hint={stats.high > 0 ? 'needs review' : undefined} />
            <StatCard label="Positions" value={totalPositions} hint={windowHours ? `${windowHours}h window` : undefined} />
          </>
        )}
      </div>

      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <VesselMap vessels={categoryVessels} selectedMmsi={selectedMmsi} onSelect={setSelectedMmsi} />

          <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] px-4 py-3">
            <input
              type="text"
              inputMode="numeric"
              placeholder="Filter by MMSI…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-40 rounded-md border border-[var(--color-border)] bg-transparent px-2.5 py-1.5 text-sm placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
            />
            <div className="flex items-center gap-1">
              {['all', ...RISK_TIERS.map((t) => t.key)].map((key) => (
                <button
                  key={key}
                  onClick={() => setTierFilter(key)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize transition ${
                    tierFilter === key
                      ? 'bg-[var(--color-text)] text-[var(--color-bg)]'
                      : 'bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
            {(search || tierFilter !== 'all') && (
              <span className="text-xs text-[var(--color-text-muted)]">
                {filteredVessels.length} of {categoryVessels.length} shown
              </span>
            )}
          </div>

          <VesselTable
            vessels={filteredVessels}
            selectedMmsi={selectedMmsi}
            onSelect={setSelectedMmsi}
            emptyMessage={
              categoryVessels.length === 0
                ? totalPositions === 0
                  ? 'No position data yet — waiting on the ingestion pipeline.'
                  : `No flagged vessels in this category — looks clear.`
                : 'No vessels match this filter.'
            }
          />
        </div>
      )}

      {loading && (
        <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="h-[480px] animate-pulse bg-[var(--color-surface-hover)]" />
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 animate-pulse rounded bg-[var(--color-surface-hover)]" />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}
