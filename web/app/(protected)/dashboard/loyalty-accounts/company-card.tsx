import { StampProgress } from './stamp-progress';
import type { LoyaltyAccount } from './types';

export function CompanyCard({ account }: { account: LoyaltyAccount }) {
  const totalStamps = Math.max(account.program.stampsRequired, 1);
  const collectedStamps = Math.min(account.program.stampCount, totalStamps);

  return (
    <div className='mt-5 rounded-[18px] border border-[#e1e5e2] bg-white p-6 shadow-[0_14px_36px_rgba(32,42,37,0.035)] sm:p-7'>
      <p className='text-[10px] font-semibold uppercase tracking-[0.2em] text-[#87918b]'>Loyalty program</p>
      <h2 className='mt-2 text-xl font-semibold tracking-[-0.04em]'>{account.company.name}</h2>
      <p className='mt-1 text-[13px] font-medium text-[#657069]'>{account.program.name}</p>

      <div className='mt-6 rounded-xl bg-[#f4f6f4] px-4 py-3.5'>
        <p className='text-[10px] font-semibold uppercase tracking-[0.16em] text-[#68736c]'>Reward</p>
        <p className='mt-1 text-[15px] font-semibold tracking-[-0.02em] text-[#202a25]'>{account.program.rewardTitle}</p>
      </div>

      <StampProgress collectedStamps={collectedStamps} totalStamps={totalStamps} />

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
