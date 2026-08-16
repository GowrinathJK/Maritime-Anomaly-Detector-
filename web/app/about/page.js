export const metadata = {
  title: 'About · Maritime Anomaly Detector',
};

function Section({ title, children }) {
  return (
    <section className="border-t border-[var(--color-border)] py-8 first:border-0 first:pt-0">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
        {children}
      </div>
    </section>
  );
}

function MethodCard({ label, children }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="text-sm font-semibold text-[var(--color-text)]">{label}</div>
      <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">{children}</p>
    </div>
  );
}

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">About this project</h1>
      <p className="mt-3 text-[var(--color-text-muted)]">
        A system for flagging vessels showing suspicious AIS behavior in the Singapore Strait —
        one of the busiest and most closely watched shipping lanes in the world.
      </p>

      <Section title="What it does">
        <p>
          Vessels broadcast their position over AIS (Automatic Identification System) every few
          seconds under normal operation. This tool watches that stream for two specific patterns
          that maritime analysts treat as worth a second look: a vessel that stops transmitting
          and reappears somewhere unexpected, and a vessel that lingers in one spot far longer
          than transit alone would explain. Flagged vessels are scored, categorized by traffic
          type, and surfaced on a live dashboard.
        </p>
      </Section>

      <Section title="How detection works">
        <div className="grid gap-3 sm:grid-cols-3">
          <MethodCard label="Gap detection">
            If a vessel goes more than 60 minutes between position reports, that&apos;s flagged as
            a gap — effectively, &quot;going dark.&quot; The system records where it was last seen,
            where it reappeared, and how far it moved in between.
          </MethodCard>
          <MethodCard label="Loitering detection">
            If a vessel stays under 2 knots and within a 1km radius for 30 minutes or more, that
            counts as loitering — movement inconsistent with normal transit through the strait.
          </MethodCard>
          <MethodCard label="Risk scoring">
            Gap and loitering events are combined into a single score per vessel, weighted by
            duration and distance, with each contributing reason capped so no single factor
            dominates the total.
          </MethodCard>
        </div>
        <p>
          Thresholds are intentionally simple and explainable rather than tuned to a training set
          — the goal is a system whose output you can sanity-check by reading the reason, not a
          black box.
        </p>
      </Section>

      <Section title="Data source status">
        <p>
          Live position data comes from{' '}
          <a
            href="https://aisstream.io"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--color-accent)] hover:underline"
          >
            AISStream.io
          </a>
          , a free public AIS feed. As of this writing, AISStream is experiencing a known,
          unresolved platform issue — connections succeed and subscriptions are accepted, but no
          position data is delivered. This is documented in their own issue tracker and is not
          specific to this project&apos;s configuration.
        </p>
        <p>
          The ingestion pipeline auto-reconnects with backoff and will resume pulling live data
          the moment the feed recovers, with no code changes required. Until then, this dashboard
          runs against a deterministic synthetic dataset built to exercise both detection paths
          (a vessel that goes dark, one that loiters, and normal traffic that should never be
          flagged) so the detection logic itself can be verified independently of feed
          availability.
        </p>
      </Section>

      <Section title="Stack">
        <p>
          Next.js (App Router) and Tailwind CSS for the dashboard, Node.js for AIS ingestion,
          Firebase Firestore for storage, and Leaflet for the map. Detection logic lives in one
          shared module used by both the ingestion pipeline and the web API, so the two can never
          drift out of sync.
        </p>
      </Section>
    </main>
  );
}
