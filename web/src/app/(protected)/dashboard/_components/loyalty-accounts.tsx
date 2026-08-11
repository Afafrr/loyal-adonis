import { CompanyCard } from './company-card';
import type { LoyaltyAccount } from '../_lib/loyalty-accounts';

export function LoyaltyAccounts({ loyaltyAccounts }: { loyaltyAccounts: LoyaltyAccount[] }) {
  if (loyaltyAccounts.length === 0) {
    return (
      <div className='mt-8 rounded-2xl border border-line-subtle bg-panel p-5 shadow-[0_18px_50px_rgba(32,42,37,0.04)] sm:mt-10 sm:rounded-[18px] sm:p-9 lg:mt-12 lg:p-10'>
        <h2 className='text-[16px] font-semibold sm:text-lg lg:text-[18px]'>No loyalty programs yet.</h2>
        <p className='mt-2 max-w-md text-[13px] leading-6 text-foreground-muted sm:text-sm lg:text-[13px]'>
          Scan a loyalty tag at a venue to join that company&apos;s loyalty program.
        </p>
      </div>
    );
  }

  const sortedAccounts = [...loyaltyAccounts].sort(compareProgressDescending);

  return (
    <section className='mt-2 sm:mt-4'>
      <div className='space-y-5'>
        {sortedAccounts.map((account) => (
          <CompanyCard account={account} key={account.id} />
        ))}
      </div>
    </section>
  );
}

function compareProgressDescending(first: LoyaltyAccount, second: LoyaltyAccount) {
  const firstProgress = first.program.stampCount / Math.max(first.program.stampsRequired, 1);
  const secondProgress = second.program.stampCount / Math.max(second.program.stampsRequired, 1);
  const progressDifference = secondProgress - firstProgress;

  if (progressDifference !== 0) {
    return progressDifference;
  }

  const companyDifference = first.company.name.localeCompare(second.company.name);
  if (companyDifference !== 0) {
    return companyDifference;
  }

  return first.id - second.id;
}
