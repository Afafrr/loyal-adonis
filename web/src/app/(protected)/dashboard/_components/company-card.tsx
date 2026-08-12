import { MapPinIcon } from '@/components/ui/icons';
import { StampProgress } from './stamp-progress';
import { companyInitials } from '../_lib/company-initials';
import type { LoyaltyAccount } from '../_lib/loyalty-accounts';

export function CompanyCard({ account }: { account: LoyaltyAccount }) {
  const totalStamps = Math.max(account.program.stampsRequired, 1);
  const collectedStamps = Math.min(account.program.stampCount, totalStamps);
  const loyaltyColor = getLoyaltyColor(account.company.id);
  const locationLabel = account.lastVisitedVenue ? formatLocation(account.lastVisitedVenue) : null;
  const venueCategory = account.lastVisitedVenue?.category;

  return (
    <article
      className='loyalty-card min-w-0 scroll-mt-6 rounded-dashboard-card border border-line-subtle bg-panel px-6 py-6 shadow-card sm:px-7'
      id={`loyalty-account-${account.id}`}
      tabIndex={-1}
    >
      <div className='flex items-start justify-between gap-4'>
        <div className='flex min-w-0 items-center gap-4'>
          <span
            aria-hidden='true'
            className={`grid size-14 shrink-0 place-items-center rounded-full text-lg font-black text-white ${loyaltyColor.filledStampClass}`}
          >
            {companyInitials(account.company.name)}
          </span>
          <div className='min-w-0'>
            <h2 className='truncate text-xl font-black'>{account.company.name}</h2>
            {venueCategory && (
              <p className='mt-0.5 truncate text-sm text-foreground-secondary'>
                {formatVenueCategory(venueCategory)}
              </p>
            )}
          </div>
        </div>
        <p className='shrink-0 rounded-full bg-panel-muted px-5 py-2 text-sm font-semibold text-foreground'>
          {collectedStamps}/{totalStamps}
        </p>
      </div>

      <div className={`mt-5 rounded-3xl px-6 py-2 bg-panel-muted`}>
        <p className='text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground-tertiary sm:text-xs lg:text-[11px]'>Reward</p>
        <p className='text-[15px] font-semibold tracking-[-0.02em] text-foreground sm:text-base lg:text-[14px]'>
          {account.program.rewardTitle}
        </p>
      </div>

      <StampProgress
        collectedStamps={collectedStamps}
        filledStampClass={loyaltyColor.filledStampClass}
        totalStamps={totalStamps}
      />

      {locationLabel && (
        <p className='mt-5 flex items-start gap-2 text-sm text-foreground-secondary'>
          <MapPinIcon className='mt-0.5 size-4 shrink-0 text-foreground-tertiary' />
          <span>{locationLabel}</span>
        </p>
      )}
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

type Location = NonNullable<LoyaltyAccount['lastVisitedVenue']>;

function formatLocation(location: Location) {
  return [location.addressLine1, location.addressLine2, location.city || null].filter(Boolean).join(', ') || location.name;
}

function formatVenueCategory(category: string) {
  return category
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toLocaleUpperCase());
}
