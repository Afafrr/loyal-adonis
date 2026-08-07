import { getLoyaltyAccounts } from '../_lib/loyalty-accounts';
import { getLoyaltyRewards } from '../_lib/loyalty-rewards';
import { PageTitle } from '../../_components/page-title';
import { LoyaltyAccounts } from './loyalty-accounts';
import { RewardBalance, shouldShowRewardBalance } from './reward-balance';

export default async function DashboardPage() {
  const [loyaltyAccounts, rewards] = await Promise.all([getLoyaltyAccounts(), getLoyaltyRewards()]);
  const showRewardBalance = shouldShowRewardBalance(loyaltyAccounts, rewards);

  return (
    <section className='mx-auto max-w-2xl px-4 pb-10 pt-4 min-[380px]:px-5 sm:px-12 sm:pb-16 sm:pt-6 lg:max-w-[47rem] lg:pt-8'>
      <PageTitle>Your rewards</PageTitle>
      {showRewardBalance && <RewardBalance loyaltyAccounts={loyaltyAccounts} rewards={rewards} />}
      {showRewardBalance && (
        <p className='mb-2 mt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground-label sm:mt-6 sm:text-xs'>
          Active programs
        </p>
      )}
      <LoyaltyAccounts loyaltyAccounts={loyaltyAccounts} />
    </section>
  );
}
