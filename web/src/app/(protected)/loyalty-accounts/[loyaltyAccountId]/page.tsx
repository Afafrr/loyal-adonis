import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRightIcon } from '@/components/ui/icons';
import { routes } from '@/lib/api/routes';
import { AccountProgress } from './_components/account-progress';
import { AvailableRewards } from './_components/rewards';
import { CompanyOverview } from './_components/company-overview';
import { RecentVisits } from './_components/recent-visits';
import { Venues } from './_components/venues';
import { getLoyaltyAccountDetail } from './_lib/loyalty-account-detail';

export const metadata: Metadata = {
  title: 'Loyalty card | Loyal Nest',
  description: 'Your loyalty card, rewards, venues, and recent visits',
};

export default async function LoyaltyAccountPage({
  params,
}: {
  params: Promise<{ loyaltyAccountId: string }>;
}) {
  const { loyaltyAccountId: loyaltyAccountIdParam } = await params;
  const loyaltyAccountId = Number(loyaltyAccountIdParam);

  if (!Number.isSafeInteger(loyaltyAccountId) || loyaltyAccountId <= 0) {
    notFound();
  }

  const account = await getLoyaltyAccountDetail(loyaltyAccountId);

  if (!account) {
    notFound();
  }

  return (
    <>
      <Link
        className='inline-flex items-center gap-1 rounded-full bg-panel-muted px-3 py-2 text-xs font-bold text-foreground-secondary transition hover:text-foreground sm:rounded-none sm:bg-transparent sm:px-0 sm:py-0 sm:text-sm'
        href={routes.dashboard}
      >
        <ChevronRightIcon className='size-4 rotate-180' />
        Your loyalty cards
      </Link>

      <CompanyOverview account={account} />

      <div className='mt-6 sm:mt-6'>
        <div>
          <AccountProgress account={account} />
          <AvailableRewards rewards={account.availableRewards} />
        </div>
        <Venues account={account} />
        <div>
          <RecentVisits stamps={account.recentStamps} />
        </div>
      </div>
    </>
  );
}
