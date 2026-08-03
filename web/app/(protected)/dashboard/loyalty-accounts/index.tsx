'use client';

import { CompanyCard } from './company-card';
import type { LoyaltyAccount } from './types';

export type { LoyaltyAccount } from './types';

interface CompanyEntry {
  companyId: number;
  companyName: string;
  accounts: LoyaltyAccount[];
}

export function LoyaltyAccounts({ loyaltyAccounts }: { loyaltyAccounts: LoyaltyAccount[] }) {
  const companies = groupAccountsByCompany(loyaltyAccounts);

  if (companies.length === 0) {
    return (
      <div className='mt-8 rounded-2xl border border-line-subtle bg-panel p-5 shadow-[0_18px_50px_rgba(32,42,37,0.04)] sm:mt-10 sm:rounded-[18px] sm:p-9'>
        <h2 className='text-[16px] font-semibold sm:text-lg'>No loyalty programs yet.</h2>
        <p className='mt-2 max-w-md text-[13px] leading-6 text-foreground-muted sm:text-sm'>
          Scan a loyalty tag at a venue to join that company&apos;s loyalty program.
        </p>
      </div>
    );
  }

  return (
    <section className='mt-8 sm:mt-10'>
      <p className='mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground-label sm:text-xs'>Your places</p>
      <div className='space-y-5'>
        {companies.map((company) => (
          <div className='space-y-5' key={company.companyId}>
            {company.accounts.map((account) => (
              <CompanyCard account={account} key={account.id} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function groupAccountsByCompany(loyaltyAccounts: LoyaltyAccount[]): CompanyEntry[] {
  const companies = new Map<number, CompanyEntry>();

  for (const account of loyaltyAccounts) {
    const company = companies.get(account.company.id);

    if (company) {
      company.accounts.push(account);
    } else {
      companies.set(account.company.id, {
        companyId: account.company.id,
        companyName: account.company.name,
        accounts: [account],
      });
    }
  }

  return [...companies.values()];
}
