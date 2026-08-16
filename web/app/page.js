'use client';

import Link from 'next/link';
import { useVesselData } from '../context/VesselDataContext';
import { CATEGORIES } from '../lib/categories';
import { CargoIcon, TankerIcon, CruiseIcon, AllTrafficIcon } from '../components/icons';

const ICONS = {
  cargo: CargoIcon,
  tanker: TankerIcon,
  cruise: CruiseIcon,
  all: AllTrafficIcon,
};

export default function Home() {
  const { loading, error, totalVesselsTracked, flaggedCountByCategory } = useVesselData();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-12 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Singapore Strait Traffic</h1>
        <p className="mt-2 text-[var(--color-text-muted)]">
          Choose a traffic category to monitor. Vessels are flagged for going dark (AIS gaps) or
          loitering in restricted patterns, scored, and surfaced in real time.
        </p>
        {!loading && !error && (
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">
            <span className="font-mono text-[var(--color-text)]">{totalVesselsTracked}</span>{' '}
            vessels currently tracked in the last 48h window.
          </p>
        )}
        {error && (
          <p className="mt-3 text-sm text-[var(--color-risk-high)]">
            Couldn&apos;t load live counts: {error}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CATEGORIES.map((category) => {
          const Icon = ICONS[category.icon];
          const count = loading ? null : flaggedCountByCategory(category.key);
          return (
            <Link
              key={category.key}
              href={`/dashboard?category=${category.key}`}
              className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition hover:-translate-y-0.5 hover:border-[var(--color-accent)]/50 hover:shadow-lg hover:shadow-black/20"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-[var(--color-surface-hover)] p-3 text-[var(--color-accent)] transition group-hover:bg-[var(--color-accent)]/10">
                  <Icon className="h-6 w-6" />
                </div>
                {count !== null && (
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      count > 0
                        ? 'bg-[#f87171]/10 text-[#f87171] ring-1 ring-inset ring-[#f87171]/30'
                        : 'bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]'
                    }`}
                  >
                    {count} flagged
                  </span>
                )}
              </div>
              <h2 className="mt-4 text-lg font-semibold">{category.label}</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{category.description}</p>
              <span className="mt-4 inline-flex items-center text-sm font-medium text-[var(--color-accent)] opacity-0 transition group-hover:opacity-100">
                View dashboard →
              </span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
