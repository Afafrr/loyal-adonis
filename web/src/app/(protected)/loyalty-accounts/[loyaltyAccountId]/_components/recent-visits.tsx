import { ClockIcon, StampIcon } from '@/components/ui/icons';
import type { LoyaltyAccountDetail } from '../_lib/loyalty-account-detail';

export function RecentVisits({ stamps }: { stamps: LoyaltyAccountDetail['recentStamps'] }) {
  return (
    <section className='mt-8 sm:mt-10'>
      <p className='text-[10px] font-extrabold uppercase tracking-[0.14em] text-foreground-label sm:text-xs'>Activity</p>
      <h2 className='mt-1 text-xl font-black tracking-[-0.035em] sm:text-2xl'>Recent visits</h2>

      <div className='mt-4 overflow-hidden rounded-[24px] border border-line-subtle bg-panel shadow-card'>
        {stamps.length > 0 ? (
          stamps.map((stamp, index) => (
            <div
              className={`flex items-center gap-4 px-5 py-4 sm:px-6 ${index < stamps.length - 1 ? 'border-b border-line-faint' : ''}`}
              key={stamp.id}
            >
              <span className='grid size-10 shrink-0 place-items-center rounded-full bg-panel-muted'>
                <StampIcon className='size-5 text-foreground-secondary' />
              </span>
              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-black sm:text-base'>{stamp.venue.name}</p>
                <p className='mt-0.5 flex items-center gap-1.5 text-[10px] font-semibold text-foreground-muted sm:text-xs'>
                  <ClockIcon className='size-3.5' />
                  {formatDate(stamp.createdAt)}
                </p>
              </div>
              <span className='shrink-0 rounded-full bg-panel-muted px-3 py-1.5 text-[10px] font-black text-foreground-secondary sm:text-xs'>
                +1 stamp
              </span>
            </div>
          ))
        ) : (
          <p className='px-5 py-6 text-sm leading-6 text-foreground-muted sm:px-6'>Your visits will appear here after your first scan.</p>
        )}
      </div>
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(value));
}
