import { getLoyaltyAccounts } from '../_lib/loyalty-accounts';
import { LoyaltyAccounts } from './loyalty-accounts';

export default async function DashboardPage() {
  const loyaltyAccounts = await getLoyaltyAccounts();

  return (
    <section className='mx-auto max-w-2xl px-4 pb-10 min-[380px]:px-5 sm:px-12 sm:pb-16 sm:pt-6 lg:max-w-[47rem] lg:pt-8'>
      <h1 className='text-4xl font-semibold leading-none tracking-[-0.06em] sm:text-5xl lg:text-[44px]'>
        Your rewards
      </h1>
      <LoyaltyAccounts loyaltyAccounts={loyaltyAccounts} />
    </section>
  );
}
