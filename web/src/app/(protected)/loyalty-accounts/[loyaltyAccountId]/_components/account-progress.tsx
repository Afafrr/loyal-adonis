import { GiftIcon } from '@/components/ui/icons';
import { StampProgress } from '../../../dashboard/_components/stamp-progress';
import { getLoyaltyColor } from '../../../dashboard/_lib/loyalty-color';
import type { LoyaltyAccountDetail } from '../_lib/loyalty-account-detail';

export function AccountProgress({ account }: { account: LoyaltyAccountDetail }) {
  const totalStamps = Math.max(account.program.stampsRequired, 1);
  const collectedStamps = Math.min(account.program.stampCount, totalStamps);
  const loyaltyColor = getLoyaltyColor(account.company.id);

  return (
    <section className='rounded-2xl bg-panel-muted p-5 sm:rounded-dashboard-card sm:border sm:border-line-subtle sm:bg-panel sm:p-8 sm:shadow-card'>
      <div>
        <p className='text-xs font-extrabold uppercase tracking-[0.12em] text-foreground-label'>Loyalty card</p>
        <h2 className='mt-1 text-xl font-black tracking-[-0.03em] sm:text-2xl'>{account.program.name}</h2>
      </div>

      <div className='mt-6 flex items-center justify-between gap-4 rounded-3xl bg-panel-muted px-5 py-4'>
        <div className='flex min-w-0 items-center gap-3'>
          <GiftIcon className='size-5 shrink-0' />
          <span className='truncate text-sm font-bold sm:text-base'>{account.program.rewardTitle}</span>
        </div>
        <span className='shrink-0 text-sm font-black'>{collectedStamps}/{totalStamps}</span>
      </div>

      <StampProgress
        collectedStamps={collectedStamps}
        filledStampClass={loyaltyColor.fillClass}
        totalStamps={totalStamps}
      />

      <p className='mt-4 text-center text-xs font-semibold text-foreground-secondary sm:text-sm'>
        {stampsMessage(collectedStamps, totalStamps)}
      </p>
    </section>
  );
}

function stampsMessage(collectedStamps: number, totalStamps: number) {
  const remaining = Math.max(totalStamps - collectedStamps, 0);

  if (remaining === 0) return 'Your next reward is ready.';
  return `${remaining} ${remaining === 1 ? 'stamp' : 'stamps'} until your next reward.`;
}
