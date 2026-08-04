import { StampProgress } from './stamp-progress';
import { getLoyaltyColor } from '../../../loyalty-palette';
import type { LoyaltyAccount } from './types';

export function CompanyCard({ account }: { account: LoyaltyAccount }) {
  const totalStamps = Math.max(account.program.stampsRequired, 1);
  const collectedStamps = Math.min(account.program.stampCount, totalStamps);
  const loyaltyColor = getLoyaltyColor(account.company.id);

  return (
    <article className='min-w-0 rounded-2xl border border-line-subtle bg-panel p-4 shadow-[0_14px_36px_rgba(32,42,37,0.035)] sm:rounded-[18px] sm:px-10 sm:py-8'>
      <h2 className='text-xs font-bold tracking-wider text-foreground-tertiary sm:text-sm'>{account.company.name}</h2>
      <p className='text-lg font-black sm:text-xl'>{account.program.name}</p>

      <div className={`mt-3 rounded-xl px-4 py-2 ${loyaltyColor.rewardPanelClass}`}>
        <p className='text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70 sm:text-xs'>Reward</p>
        <p className='text-[15px] font-semibold tracking-[-0.02em] text-white sm:text-base'>
          {account.program.rewardTitle}
        </p>
      </div>

      <StampProgress
        collectedStamps={collectedStamps}
        filledStampClass={loyaltyColor.filledStampClass}
        totalStamps={totalStamps}
      />

      {account.locations.length > 0 && (
        <div className='mt-3 border-t border-line-faint pt-4'>
          <p className='mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-foreground-label sm:text-xs'>
            Recently visited
          </p>
          <ul className='mt-1'>
            {account.locations.map((location) => (
              <li
                className='flex items-baseline justify-between gap-4 text-sm font-bold'
                key={location.id}
              >
                <span className='min-w-0 truncate text-foreground'>
                  {location.name} ·{' '}
                  <span suppressHydrationWarning>{formatLastVisit(location.lastVisitedAt)}</span>
                </span>
                <span className={`shrink-0 ${loyaltyColor.locationTextClass}`}>
                  {location.stampCount} {location.stampCount === 1 ? 'stamp' : 'stamps'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

function formatLastVisit(lastVisitedAt: string) {
  const visit = new Date(lastVisitedAt);
  const today = new Date();

  if (Number.isNaN(visit.getTime())) {
    return '';
  }

  const visitDay = Date.UTC(visit.getFullYear(), visit.getMonth(), visit.getDate());
  const todayDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const daysAgo = Math.round((todayDay - visitDay) / 86_400_000);

  if (daysAgo === 0) {
    return 'today';
  }

  if (daysAgo > 0 && daysAgo < 7) {
    return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(visit);
  }

  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: visit.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  }).format(visit);
}
