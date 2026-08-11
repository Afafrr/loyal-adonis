import { PageTitle } from '@/components/ui/page-title';
import { DesktopDashboardSummary } from './_components/desktop-dashboard-summary';
import { LatestActivity } from './_components/latest-activity';
import { LoyaltyAccounts } from './_components/loyalty-accounts';
import { RewardBalance } from './_components/reward-balance';
import { getLatestActivity } from './_lib/latest-activity';
import { getLoyaltyAccounts } from './_lib/loyalty-accounts';

export default async function DashboardPage() {
  const [loyaltyAccounts, latestActivity] = await Promise.all([getLoyaltyAccounts(), getLatestActivity()]);

  return (
    <section className='mx-auto max-w-2xl px-4 pb-10 pt-4 min-[380px]:px-5 sm:px-12 sm:pb-16 sm:pt-6 md:max-w-355 md:px-10 md:pt-8'>
      <PageTitle>Your rewards</PageTitle>

      {loyaltyAccounts.length > 0 && (
        <div className='mt-6 md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(22rem,1fr)] md:gap-3 lg:gap-5'>
          <RewardBalance loyaltyAccounts={loyaltyAccounts} />
          <DesktopDashboardSummary latestActivity={latestActivity} />
        </div>
      )}

      <div className='md:hidden'>
        <LatestActivity activity={latestActivity} />
      </div>

      {loyaltyAccounts.length > 0 && (
        <p className='mt-6 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground-label sm:mt-7 sm:text-xs md:mt-12'>
          Your loyalty cards
        </p>
      )}
      <LoyaltyAccounts loyaltyAccounts={loyaltyAccounts} />
    </section>
  );
}
