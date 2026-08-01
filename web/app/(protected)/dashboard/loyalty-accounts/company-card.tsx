import { StampProgress } from './stamp-progress';
import type { LoyaltyAccount } from './types';

export function CompanyCard({ account }: { account: LoyaltyAccount }) {
  const totalStamps = Math.max(account.program.stampsRequired, 1);
  const collectedStamps = Math.min(account.program.stampCount, totalStamps);
  const topLocations = account.locations.slice(0, 2);

  return (
    <article className='rounded-[18px] border border-line-subtle bg-panel p-6 shadow-[0_14px_36px_rgba(32,42,37,0.035)] sm:p-7'>
      <p className='text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground-label'>Loyalty program</p>
      <h2 className='mt-2 text-xl font-semibold tracking-[-0.04em]'>{account.company.name}</h2>
      <p className='mt-1 text-[13px] font-medium text-foreground-tertiary'>{account.program.name}</p>

      <div className='mt-6 rounded-xl bg-panel-subtle px-4 py-3.5'>
        <p className='text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground-tertiary'>Reward</p>
        <p className='mt-1 text-[15px] font-semibold tracking-[-0.02em] text-foreground'>{account.program.rewardTitle}</p>
      </div>

      <StampProgress collectedStamps={collectedStamps} totalStamps={totalStamps} />

      <div className='mt-6 border-t border-line-faint pt-5'>
        <p className='text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground-label'>Stamps collected across</p>
        <ul className='mt-3 space-y-2'>
          {topLocations.map((location) => (
            <li className='flex items-center gap-3 text-[15px] font-semibold text-foreground' key={location.id}>
              <span aria-hidden='true' className='size-3.5 shrink-0 rounded-full border border-emerald-600' />
              <span>
                {location.name} · {location.stampCount} {location.stampCount === 1 ? 'stamp' : 'stamps'}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
