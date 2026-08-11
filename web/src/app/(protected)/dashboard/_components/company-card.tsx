import { StampProgress } from './stamp-progress';
import { companyInitials } from '../_lib/company-initials';
import type { LoyaltyAccount } from '../_lib/loyalty-accounts';

export function CompanyCard({ account }: { account: LoyaltyAccount }) {
  const totalStamps = Math.max(account.program.stampsRequired, 1);
  const collectedStamps = Math.min(account.program.stampCount, totalStamps);
  const loyaltyColor = getLoyaltyColor(account.company.id);

  return (
    <article
      className='loyalty-card min-w-0 scroll-mt-6 rounded-dashboard-card border border-line-subtle bg-panel px-6 py-6 shadow-[0_14px_36px_rgba(32,42,37,0.035)] sm:px-7'
      id={`loyalty-account-${account.id}`}
      tabIndex={-1}
    >
      <div className='flex items-center gap-4'>
        <span
          aria-hidden='true'
          className={`grid size-14 shrink-0 place-items-center rounded-full text-lg font-black text-white ${loyaltyColor.filledStampClass}`}
        >
          {companyInitials(account.company.name)}
        </span>
        <div className='min-w-0'>
          <h2 className='truncate text-xl font-black'>{account.company.name}</h2>
          <p className='mt-0.5 truncate text-sm text-foreground-secondary'>{account.program.name}</p>
        </div>
      </div>

      <div className={`mt-5 rounded-xl px-4 py-2 ${loyaltyColor.rewardPanelClass}`}>
        <p className='text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70 sm:text-xs lg:text-[11px]'>Reward</p>
        <p className='text-[15px] font-semibold tracking-[-0.02em] text-white sm:text-base lg:text-[14px]'>
          {account.program.rewardTitle}
        </p>
      </div>

      <StampProgress
        collectedStamps={collectedStamps}
        filledStampClass={loyaltyColor.filledStampClass}
        totalStamps={totalStamps}
      />
    </article>
  );
}

interface LoyaltyPaletteColor {
  rewardPanelClass: string;
  filledStampClass: string;
}

const loyaltyPalette: LoyaltyPaletteColor[] = [
  {
    rewardPanelClass: 'bg-reward-coffee',
    filledStampClass: 'bg-reward-coffee',
  },
  {
    rewardPanelClass: 'bg-reward-burgundy',
    filledStampClass: 'bg-reward-burgundy',
  },
  {
    rewardPanelClass: 'bg-reward-olive',
    filledStampClass: 'bg-reward-olive',
  },
  {
    rewardPanelClass: 'bg-reward-navy',
    filledStampClass: 'bg-reward-navy',
  },
];

/**
 * Temporary presentation mapping until a visual color is stored on the loyalty program.
 * A company receives the same color on every render without changing API data.
 */
function getLoyaltyColor(companyId: number): LoyaltyPaletteColor {
  return loyaltyPalette[Math.max(companyId - 1, 0) % loyaltyPalette.length];
}
