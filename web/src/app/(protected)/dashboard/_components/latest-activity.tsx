import type { LatestActivity as LatestActivityData } from '../_lib/latest-activity';

export function LatestActivity({ activity }: { activity: LatestActivityData | null }) {
  if (!activity) {
    return null;
  }

  return (
    <section className='mt-6 sm:mt-7'>
      <p className='text-[10px] font-bold uppercase tracking-[0.14em] text-foreground-label sm:text-xs'>
        Latest activity
      </p>
      <a
        className='mt-2 flex items-center justify-between gap-4 rounded-2xl border border-line-subtle bg-panel px-4 py-4 shadow-card transition-colors hover:bg-panel-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-reward-olive sm:px-6'
        href={`#loyalty-account-${activity.loyaltyAccountId}`}
      >
        <span className='min-w-0'>
          <span className='block truncate text-sm font-black text-foreground sm:text-base'>{activity.venue.name}</span>
          <span className='mt-0.5 block text-xs font-semibold text-foreground-muted sm:text-sm'>
            {activity.company.name} · {formatActivityDate(activity.visitedAt)}
          </span>
        </span>
        <span className='shrink-0 rounded-full bg-reward-olive/10 px-3 py-1 text-xs font-extrabold text-reward-olive'>
          +1 stamp
        </span>
      </a>
    </section>
  );
}

function formatActivityDate(visitedAt: string) {
  const date = new Date(visitedAt);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
