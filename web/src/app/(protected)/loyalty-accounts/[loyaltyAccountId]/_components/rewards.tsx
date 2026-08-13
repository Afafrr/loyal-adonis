import { GiftIcon } from '@/components/ui/icons';
import type { LoyaltyAccountDetail } from '../_lib/loyalty-account-detail';

export function AvailableRewards({ rewards }: { rewards: LoyaltyAccountDetail['availableRewards'] }) {
  if (rewards.length === 0) return null;

  return (
    <section className='mt-5 rounded-dashboard-card bg-brand px-5 py-5 text-white shadow-brand sm:px-8 sm:py-6'>
      <p className='text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/60 sm:text-xs'>Available rewards</p>
      <div className='mt-4 grid gap-3'>
        {rewards.map((reward) => (
          <div className='flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3' key={reward.id}>
            <span className='grid size-9 shrink-0 place-items-center rounded-full bg-white text-brand'>
              <GiftIcon className='size-4' />
            </span>
            <div className='min-w-0'>
              <p className='truncate text-sm font-black sm:text-base'>{reward.title}</p>
              <p className='mt-0.5 text-[10px] font-semibold text-white/60 sm:text-xs'>Earned {formatDate(reward.earnedAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(value),
  );
}
