'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NotificationBell from './NotificationBell';
import { AnchorIcon } from './icons';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/about', label: 'About' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
          <AnchorIcon className="h-5 w-5 shrink-0 text-[var(--color-accent)]" />
          <span className="hidden sm:inline whitespace-nowrap">Maritime Anomaly Detector</span>
          <span className="sm:hidden">MAD</span>
        </Link>

        <nav className="flex items-center gap-0.5 sm:gap-1">
          {LINKS.map((link) => {
            const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-medium transition sm:px-3 sm:text-sm ${
                  active
                    ? 'bg-[var(--color-surface)] text-[var(--color-text)]'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="ml-1 h-5 w-px shrink-0 bg-[var(--color-border)]" />
          <NotificationBell />
        </nav>
      </div>
    </header>
  );
}
