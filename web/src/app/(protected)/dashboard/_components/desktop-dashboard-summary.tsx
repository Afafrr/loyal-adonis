'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { ClockIcon, StampIcon, TrophyIcon } from '@/components/ui/icons';
import { routes } from '@/lib/api/routes';
import type { LatestActivity } from '../_lib/latest-activity';

const desktopMediaQuery = '(min-width: 48rem)';

type DesktopStats = {
  visitCount: number;
  availableRewardCount: number;
};

export function DesktopDashboardSummary({ latestActivity }: { latestActivity: LatestActivity | null }) {
  const [stats, setStats] = useState<DesktopStats | null>(null);

  useEffect(() => {
    // Fetch detailed stats only when the tablet layout is visible. If the page
    // starts on mobile, wait for the first resize across the tablet breakpoint.
    const desktop = window.matchMedia(desktopMediaQuery);
    const abortController = new AbortController();

    function loadStats() {
      fetch(routes.api.profile, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
        signal: abortController.signal,
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Dashboard stats request failed with status ${response.status}.`);
          }

          return response.json() as Promise<DesktopStats>;
        })
        .then(setStats)
        .catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === 'AbortError')) {
            console.error(error);
          }
        });
    }

    if (desktop.matches) {
      loadStats();
    } else {
      desktop.addEventListener('change', loadStats, { once: true });
    }

    return () => {
      abortController.abort();
      desktop.removeEventListener('change', loadStats);
    };
  }, []);

  return (
    <aside className='hidden min-h-full grid-rows-[1fr_auto] md:gap-3 lg:gap-5 md:grid' aria-label='Loyalty summary'>
      <section className='rounded-dashboard-card border border-line-subtle bg-panel px-7 py-6 shadow-[0_14px_36px_rgba(32,42,37,0.035)]'>
        <p className='flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-foreground-tertiary'>
          <ClockIcon className='size-5' />
          Last visited
        </p>
        {latestActivity ? (
          <a
            className='mt-5 flex items-center gap-4 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-reward-coffee'
            href={`#loyalty-account-${latestActivity.loyaltyAccountId}`}
          >
            <span className='grid size-14 shrink-0 place-items-center rounded-full bg-reward-coffee text-lg font-black text-white'>
              {companyInitials(latestActivity.company.name)}
            </span>
            <span className='min-w-0'>
              <span className='block truncate text-xl font-black'>{latestActivity.company.name}</span>
              <span className='mt-0.5 block truncate text-sm text-foreground-secondary'>
                {latestActivity.venue.name} · {formatActivityDate(latestActivity.visitedAt)} · +1 stamp
              </span>
            </span>
          </a>
        ) : (
          <p className='mt-5 text-sm text-foreground-muted'>Your latest visit will appear here.</p>
        )}
      </section>

      <div className='grid grid-cols-2 md:gap-3 lg:gap-5'>
        <StatCard icon={<StampIcon className='size-5' />} label='Stamps collected' value={stats?.visitCount} />
        <StatCard
          icon={<TrophyIcon className='size-5' />}
          label='Rewards ready'
          value={stats?.availableRewardCount}
        />
      </div>
    </aside>
  );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: number | undefined }) {
  return (
    <section className='relative rounded-dashboard-card border border-line-subtle bg-panel px-8 py-4 shadow-[0_14px_36px_rgba(32,42,37,0.035)]'>
      <span className='absolute right-6 top-5 text-foreground-tertiary'>{icon}</span>
      <p className='mt-1 text-4xl font-black leading-none'>{value ?? '—'}</p>
      <p className='mt-2 text-sm text-foreground-secondary'>{label}</p>
    </section>
  );
}

function companyInitials(companyName: string) {
  return companyName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toLocaleUpperCase();
}

function formatActivityDate(visitedAt: string) {
  const date = new Date(visitedAt);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(date);
}
