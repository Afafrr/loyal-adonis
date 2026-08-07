import { getLatestActivity } from '../_lib/latest-activity';
import { getLoyaltyAccounts } from '../_lib/loyalty-accounts';
import { getLoyaltyRewards } from '../_lib/loyalty-rewards';
import { PageTitle } from '../../_components/page-title';
import { LoyaltyAccounts } from './loyalty-accounts';
import { LatestActivity } from './latest-activity';
import { RewardBalance, shouldShowRewardBalance } from './reward-balance';

export default async function DashboardPage() {
  const [loyaltyAccounts, rewards, latestActivity] = await Promise.all([
    getLoyaltyAccounts(),
    getLoyaltyRewards(),
    getLatestActivity(),
  ]);
  const showRewardBalance = shouldShowRewardBalance(loyaltyAccounts, rewards);

  return (
    <section className='mx-auto max-w-2xl px-4 pb-10 pt-4 min-[380px]:px-5 sm:px-12 sm:pb-16 sm:pt-6 lg:max-w-[47rem] lg:pt-8'>
      <PageTitle>Your rewards</PageTitle>
      {showRewardBalance && <RewardBalance loyaltyAccounts={loyaltyAccounts} rewards={rewards} />}
      <LatestActivity activity={latestActivity} />
      {loyaltyAccounts.length > 0 && (
        <p className='mt-6 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground-label sm:mt-7 sm:text-xs'>
          Your loyalty cards
        </p>
      )}
      <LoyaltyAccounts loyaltyAccounts={loyaltyAccounts} />
    </section>
  );
}
