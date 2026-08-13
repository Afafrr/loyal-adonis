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
    <section className='mx-auto max-w-4xl px-4 pb-12 pt-2 min-[380px]:px-5 sm:px-12 sm:pb-16 sm:pt-6 md:px-10'>
      <Link
        className='inline-flex items-center gap-1 text-xs font-bold text-foreground-secondary transition hover:text-foreground sm:text-sm'
        href={routes.dashboard}
      >
        <ChevronRightIcon className='size-4 rotate-180' />
        Your rewards
      </Link>

      <CompanyOverview account={account} />

      <div className='mt-4 sm:mt-6'>
        <div>
          <AccountProgress account={account} />
          <AvailableRewards rewards={account.availableRewards} />
        </div>
        <Venues account={account} />
        <div>
          <RecentVisits stamps={account.recentStamps} />
        </div>
      </div>
    </section>
  );
}
