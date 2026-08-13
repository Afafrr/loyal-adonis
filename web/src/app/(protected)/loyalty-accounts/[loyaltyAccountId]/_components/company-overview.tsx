import { MapPinIcon } from '@/components/ui/icons';
import { companyInitials } from '../../../dashboard/_lib/company-initials';
import { getLoyaltyColor } from '../../../dashboard/_lib/loyalty-color';
import type { LoyaltyAccountDetail } from '../_lib/loyalty-account-detail';

export function CompanyOverview({ account }: { account: LoyaltyAccountDetail }) {
  const loyaltyColor = getLoyaltyColor(account.company.id);
  const category = account.venues.find((venue) => venue.category)?.category;

  return (
    <header className='grid gap-5 py-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-6 sm:py-6'>
      <span
        aria-hidden='true'
        className={`grid size-20 place-items-center rounded-full text-2xl font-black text-white shadow-card sm:size-24 sm:text-3xl ${loyaltyColor.fillClass}`}
      >
        {companyInitials(account.company.name)}
      </span>

      <div className='min-w-0'>
        <p className='text-[10px] font-extrabold uppercase tracking-[0.14em] text-foreground-label sm:text-xs'>
          {category ? formatCategory(category) : 'Local business'}
        </p>
        <h1 className='mt-1 text-3xl font-black tracking-[-0.045em] sm:text-4xl'>{account.company.name}</h1>
        <p className='mt-3 flex items-center gap-2 text-sm font-bold text-foreground-secondary sm:text-base'>
          <MapPinIcon className='size-4 shrink-0' />
          {account.venueCount} {account.venueCount === 1 ? 'participating venue' : 'participating venues'}
        </p>
        <p className='mt-3 max-w-2xl text-sm leading-6 text-foreground-muted sm:text-base sm:leading-7'>
          Collect stamps at participating venues and turn your visits into rewards.
        </p>
      </div>
    </header>
  );
}

function formatCategory(category: string) {
  return category.replace(/[-_]/g, ' ');
}
