import { ViewTransition } from 'react';
import { GiftIcon, MapPinIcon } from '@/components/ui/icons';
import { routes } from '@/lib/api/routes';
import { getLoyaltyCardTransitionNames } from '@/lib/loyalty-card-transition';
import { LoyaltyCardLink } from './loyalty-card-link';
import { StampProgress } from './stamp-progress';
import { companyInitials } from '../_lib/company-initials';
import { getLoyaltyColor } from '../_lib/loyalty-color';
import type { LoyaltyAccount } from '../_lib/loyalty-accounts';

export function CompanyCard({ account }: { account: LoyaltyAccount }) {
  const totalStamps = Math.max(account.program.stampsRequired, 1);
  const collectedStamps = Math.min(account.program.stampCount, totalStamps);
  const loyaltyColor = getLoyaltyColor(account.company.id);
  const locationLabel = account.lastVisitedVenue ? formatLocation(account.lastVisitedVenue) : null;
  const venueCategory = account.lastVisitedVenue?.category;
  const transitionNames = getLoyaltyCardTransitionNames(account.id);
  const titleId = `loyalty-account-${account.id}-title`;

  return (
    <LoyaltyCardLink
      ariaLabelledby={titleId}
      className='loyalty-card min-w-0 scroll-mt-6 rounded-dashboard-card border border-line-subtle bg-panel px-4 py-4 shadow-card transition hover:-translate-y-0.5 hover:border-line-hover hover:shadow-card-wide focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:px-8 sm:py-8'
      href={routes.loyaltyAccount(account.id)}
      id={`loyalty-account-${account.id}`}
      navigationSummary={{
        loyaltyAccountId: account.id,
        companyId: account.company.id,
        companyName: account.company.name,
      }}
      transitionName={transitionNames.card}
    >
      <div className='flex items-start justify-between gap-4'>
        <div className='flex min-w-0 items-center gap-4'>
          <ViewTransition default='none' name={transitionNames.avatar} share='loyalty-card-avatar-morph'>
            <span
              aria-hidden='true'
              className={`grid size-14 shrink-0 place-items-center rounded-full text-lg font-black text-white ${loyaltyColor.fillClass}`}
            >
              {companyInitials(account.company.name)}
            </span>
          </ViewTransition>
          <div className='min-w-0'>
            <h2 className='truncate text-base font-black md:text-xl' id={titleId}>
              {account.company.name}
            </h2>
            {venueCategory && (
              <p className='mt-0.5 truncate text-xs md:text-base text-foreground-secondary uppercase'>
                {formatVenueCategory(venueCategory)}
              </p>
            )}
          </div>
        </div>
        <p className='hidden shrink-0 rounded-full bg-panel-muted px-5 py-2 text-sm font-semibold text-foreground sm:block'>
          {collectedStamps}/{totalStamps}
        </p>
      </div>

      <div className='mt-5 flex items-center gap-4 rounded-3xl bg-panel-muted px-6 py-3'>
        <GiftIcon className={`size-5 shrink-0`} />
        <div className='min-w-0'>
          <p className='truncate text-[15px] font-semibold tracking-[-0.02em] text-foreground sm:text-base lg:text-[14px]'>
            {account.program.rewardTitle}
          </p>
        </div>
      </div>

      <StampProgress
        collectedStamps={collectedStamps}
        filledStampClass={loyaltyColor.fillClass}
        totalStamps={totalStamps}
      />

      {locationLabel && (
        <p className='mt-3 flex items-start gap-2 text-sm text-foreground-secondary'>
          <MapPinIcon className='mt-0.5 size-4 shrink-0 text-foreground-tertiary' />
          <span>{locationLabel}</span>
        </p>
      )}
    </LoyaltyCardLink>
  );
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
