'use client';

import { useEffect, useRef, useState } from 'react';
import { useVesselData } from '../context/VesselDataContext';
import { riskTier } from '../lib/risk';
import { BellIcon } from './icons';

function relativeTime(timestamp) {
  const diffMs = Date.now() - timestamp;
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function NotificationBell() {
  const { notifications, unseenMmsis, markAllSeen } = useVesselData();
  const [open, setOpen] = useState(false);
  const [seenWhileOpen, setSeenWhileOpen] = useState(() => new Set());
  const panelRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function toggle() {
    if (!open) {
      // Snapshot which items are "new" before marking them seen, so the NEW
      // tags stay visible for this viewing rather than vanishing instantly.
      setSeenWhileOpen(new Set(unseenMmsis));
      markAllSeen();
    }
    setOpen((v) => !v);
  }

  const badgeCount = unseenMmsis.size;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={toggle}
        aria-label="Notifications"
        className="relative rounded-lg p-2 text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
      >
        <BellIcon className="h-5 w-5" />
        {badgeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-risk-high)] px-1 text-[10px] font-semibold text-[#2b0505]">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
          <div className="border-b border-[var(--color-border)] px-4 py-2.5 text-sm font-medium">
            Flagged vessels
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
                No active flags. All clear.
              </div>
            ) : (
              notifications.map((v) => {
                const tier = riskTier(v.score);
                const isNew = seenWhileOpen.has(v.mmsi);
                return (
                  <div
                    key={v.mmsi}
                    className="flex items-start gap-3 border-b border-[var(--color-border)] px-4 py-3 last:border-0"
                  >
                    <span
                      className="mt-1 h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: tier.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{v.mmsi}</span>
                        {isNew && (
                          <span className="rounded bg-[var(--color-accent)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-accent-foreground)]">
                            NEW
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">
                        {v.reasons[0]}
                        {v.reasons.length > 1 ? ` (+${v.reasons.length - 1} more)` : ''}
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-xs text-[var(--color-text-muted)]">
                      <div style={{ color: tier.color }} className="font-medium">
                        {v.score}
                      </div>
                      <div>{relativeTime(v.lastPosition.timestamp)}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
