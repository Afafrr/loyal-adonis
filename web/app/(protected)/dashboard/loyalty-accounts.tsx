'use client';

import { useState } from 'react';

export interface LoyaltyAccount {
  id: number;
  program: {
    id: number;
    name: string;
    rewardTitle: string;
    stampsRequired: number;
    stampCount: number;
  };
  company: {
    id: number;
    name: string;
  };
  locations: Array<{
    id: number;
    name: string;
    firstScannedAt: string;
  }>;
}

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
      <div className='mt-10 rounded-[18px] border border-[#e1e5e2] bg-white p-7 shadow-[0_18px_50px_rgba(32,42,37,0.04)] sm:p-9'>
        <h2 className='text-[16px] font-semibold'>No loyalty programs yet.</h2>
        <p className='mt-2 max-w-md text-[13px] leading-6 text-[#7a837e]'>
          Scan a loyalty tag at a venue to join that company&apos;s loyalty program.
        </p>
      </div>
    );
  }

  return (
    <section className='mt-10'>
      <p className='mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#87918b]'>Your companies</p>
      <div className='flex gap-2 overflow-x-auto pb-2'>
        {companies.map((company) => {
          const selected = company.companyId === selectedCompanyId;

          return (
            <button
              className={`shrink-0 rounded-full border px-4 py-2 text-left text-[13px] transition ${
                selected
                  ? 'border-[#1f2924] bg-[#1f2924] text-white'
                  : 'border-[#dfe4e0] bg-white text-[#536059] hover:border-[#aab4ad]'
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

      {selectedCompany && <CompanyCard company={selectedCompany} />}
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

function CompanyCard({ company }: { company: CompanyEntry }) {
  const { account } = company;
  const totalStamps = Math.max(account.program.stampsRequired, 1);
  const collectedStamps = Math.min(account.program.stampCount, totalStamps);

  return (
    <div className='mt-5 rounded-[18px] border border-[#e1e5e2] bg-white p-6 shadow-[0_14px_36px_rgba(32,42,37,0.035)] sm:p-7'>
      <p className='text-[10px] font-semibold uppercase tracking-[0.2em] text-[#87918b]'>Loyalty program</p>
      <h2 className='mt-2 text-xl font-semibold tracking-[-0.04em]'>{company.companyName}</h2>
      <p className='mt-1 text-[13px] font-medium text-[#657069]'>{account.program.name}</p>

      <div className='mt-6 rounded-xl bg-[#f4f6f4] px-4 py-3.5'>
        <p className='text-[10px] font-semibold uppercase tracking-[0.16em] text-[#68736c]'>Reward</p>
        <p className='mt-1 text-[15px] font-semibold tracking-[-0.02em] text-[#202a25]'>{account.program.rewardTitle}</p>
      </div>

      <div className='mt-6'>
        <div className='flex items-baseline justify-between gap-4'>
          <p className='text-[13px] font-semibold text-[#202a25]'>Your progress</p>
          <p className='text-[13px] font-semibold text-[#536059]'>
            {collectedStamps} / {totalStamps}
          </p>
        </div>
        <div aria-label={`${collectedStamps} of ${totalStamps} stamps collected`} className='mt-3 flex flex-wrap gap-2'>
          {Array.from({ length: totalStamps }, (_, index) => {
            const collected = index < collectedStamps;

            return (
              <span
                aria-hidden='true'
                className={`size-4 rounded-full border-2 ${
                  collected ? 'border-[#1f2924] bg-[#1f2924]' : 'border-[#c8d0cb] bg-white'
                }`}
                key={index}
              />
            );
          })}
        </div>
        <p className='mt-3 text-[13px] leading-5 text-[#657069]'>
          Collect stamps across any participating venue.
        </p>
      </div>

      <div className='mt-6 border-t border-[#edf0ee] pt-5'>
        <p className='text-[10px] font-semibold uppercase tracking-[0.2em] text-[#87918b]'>Visited venues</p>
        <ul className='mt-2.5 flex flex-wrap gap-2'>
          {account.locations.map((location) => (
            <li className='rounded-full bg-[#f2f4f2] px-3 py-1.5 text-[13px] text-[#536059]' key={location.id}>
              {location.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
