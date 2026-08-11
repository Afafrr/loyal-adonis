import { StampProgress } from './stamp-progress';
import type { LoyaltyAccount } from '../_lib/loyalty-accounts';

export function CompanyCard({ account }: { account: LoyaltyAccount }) {
  const totalStamps = Math.max(account.program.stampsRequired, 1);
  const collectedStamps = Math.min(account.program.stampCount, totalStamps);
  const loyaltyColor = getLoyaltyColor(account.company.id);

  return (
    <article
      className='loyalty-card min-w-0 scroll-mt-6 rounded-3xl border border-line-subtle bg-panel p-4 shadow-[0_14px_36px_rgba(32,42,37,0.035)] sm:rounded-[18px] sm:px-10 sm:py-8 lg:px-11 lg:py-9'
      id={`loyalty-account-${account.id}`}
      tabIndex={-1}
    >
      <h2 className='text-xs font-bold tracking-wider text-foreground-tertiary sm:text-sm lg:text-[13px]'>{account.company.name}</h2>
      <p className='text-lg font-black sm:text-xl lg:text-[18px]'>{account.program.name}</p>

      <div className={`mt-3 rounded-xl px-4 py-2 ${loyaltyColor.rewardPanelClass}`}>
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
