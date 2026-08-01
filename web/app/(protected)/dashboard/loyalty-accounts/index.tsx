'use client';

import { useState } from 'react';
import { CompanyCard } from './company-card';
import type { LoyaltyAccount } from './types';

export type { LoyaltyAccount } from './types';

interface CompanyEntry {
  companyId: number;
  companyName: string;
  account: LoyaltyAccount;
}

export function LoyaltyAccounts({ loyaltyAccounts }: { loyaltyAccounts: LoyaltyAccount[] }) {
  const companies = groupAccountsByCompany(loyaltyAccounts);
  const [selectedCompanyId, setSelectedCompanyId] = useState(companies[0]?.companyId);
  const selectedCompany = companies.find((company) => company.companyId === selectedCompanyId);

  if (companies.length === 0) {
    return (
      <div className='mt-10 rounded-[18px] border border-line-subtle bg-panel p-7 shadow-[0_18px_50px_rgba(32,42,37,0.04)] sm:p-9'>
        <h2 className='text-[16px] font-semibold'>No loyalty programs yet.</h2>
        <p className='mt-2 max-w-md text-[13px] leading-6 text-foreground-muted'>
          Scan a loyalty tag at a venue to join that company&apos;s loyalty program.
        </p>
      </div>
    );
  }

  return (
    <section className='mt-10'>
      <p className='mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground-label'>Your companies</p>
      <div className='flex gap-2 overflow-x-auto pb-2'>
        {companies.map((company) => {
          const selected = company.companyId === selectedCompanyId;

          return (
            <button
              className={`shrink-0 rounded-full border px-4 py-2 text-left text-[13px] transition ${
                selected
                  ? 'border-brand bg-brand text-white'
                  : 'border-line-subtle bg-panel text-foreground-secondary hover:border-line-hover'
              }`}
              key={company.companyId}
              onClick={() => setSelectedCompanyId(company.companyId)}
              type='button'
            >
              {company.companyName}
            </button>
          );
        })}
      </div>

      {selectedCompany && <CompanyCard account={selectedCompany.account} />}
    </section>
  );
}

function groupAccountsByCompany(loyaltyAccounts: LoyaltyAccount[]): CompanyEntry[] {
  const companies = new Map<number, CompanyEntry>();

  for (const account of loyaltyAccounts) {
    companies.set(account.company.id, {
      companyId: account.company.id,
      companyName: account.company.name,
      account,
    });
  }

  return [...companies.values()];
}
