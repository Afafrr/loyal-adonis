import { GiftIcon } from '@/components/ui/icons';
import type { LoyaltyAccount } from '../_lib/loyalty-accounts';

export function RewardBalance({ loyaltyAccounts }: { loyaltyAccounts: LoyaltyAccount[] }) {
  const nextReward = findNextReward(loyaltyAccounts);

  if (!nextReward) {
    return null;
  }

  return (
    <section className='flex flex-col justify-center rounded-[26px] bg-[linear-gradient(120deg,#1f2824_0%,#32443D_90%)] px-5 py-6 text-white shadow-[0_16px_36px_rgba(32,42,37,0.1)] sm:px-12 sm:py-8'>
      <p className='text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/65 sm:text-xs'>
        Your loyalty balance
      </p>
      <p className='mt-2 text-3xl font-black leading-none tracking-[-0.02em] sm:text-4xl'>Your next reward</p>
      <p className='mt-5 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold text-white/85 sm:rounded-2xl sm:px-6 sm:py-5 sm:text-[15px]'>
        <GiftIcon className='size-4 shrink-0' />
        <span>
          {nextReward.remainingStamps === 1
            ? `One stamp to ${nextReward.title}`
            : `${nextReward.remainingStamps} stamps to ${nextReward.title}`}
        </span>
      </p>
    </section>
  );
}

function findNextReward(loyaltyAccounts: LoyaltyAccount[]) {
  return loyaltyAccounts.reduce<
    | {
        remainingStamps: number;
        title: string;
      }
    | undefined
  >((closestReward, account) => {
    const remainingStamps = Math.max(account.program.stampsRequired - account.program.stampCount, 0);

    if (!closestReward || remainingStamps < closestReward.remainingStamps) {
      return {
        remainingStamps,
        title: account.program.rewardTitle,
      };
    }

    return closestReward;
  }, undefined);
}
