import { headers } from 'next/headers';
import { serverRoutes } from '../../routes';
import { LoyaltyAccounts } from './loyalty-accounts';
import type { LoyaltyAccount } from './loyalty-accounts/types';

async function getLoyaltyAccounts(cookie: string | null): Promise<LoyaltyAccount[]> {
  if (!cookie) return [];

  const response = await fetch(serverRoutes.api.loyaltyAccounts, {
    headers: { Cookie: cookie },
    cache: 'no-store',
  });

  if (!response.ok) return [];
  const data = (await response.json()) as { loyaltyAccounts: LoyaltyAccount[] };
  return data.loyaltyAccounts;
}

export default async function DashboardPage() {
  const cookie = (await headers()).get('cookie');
  const loyaltyAccounts = await getLoyaltyAccounts(cookie);

  return (
    <section className='mx-auto max-w-2xl px-4 pb-10 pt-4 min-[380px]:px-5 sm:px-12 sm:pb-16 sm:pt-6'>
      <h1 className='text-4xl font-semibold leading-none tracking-[-0.06em] sm:text-5xl'>One place for loyalty.</h1>
      <LoyaltyAccounts loyaltyAccounts={loyaltyAccounts} />
    </section>
  );
}
