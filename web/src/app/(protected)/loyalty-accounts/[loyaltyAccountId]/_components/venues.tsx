import { MapPinIcon } from '@/components/ui/icons';
import type { LoyaltyAccountDetail, Venue } from '../_lib/loyalty-account-detail';

export function Venues({ account }: { account: LoyaltyAccountDetail }) {
  return (
    <section className='mt-8 sm:mt-10'>
      <div className='flex items-end justify-between gap-4'>
        <div>
          <p className='text-[10px] font-extrabold uppercase tracking-[0.14em] text-foreground-label sm:text-xs'>Venues</p>
          <h2 className='mt-1 text-xl font-black tracking-[-0.035em] sm:text-2xl'>
            {account.primaryCity ? `Near you in ${account.primaryCity}` : 'Where to collect stamps'}
          </h2>
        </div>
        <span className='shrink-0 text-xs font-bold text-foreground-muted'>
          {account.venueCount} {account.venueCount === 1 ? 'venue' : 'venues'} total
        </span>
      </div>

      {account.venues.length > 0 ? (
        <div className={`mt-4 grid gap-3 ${account.venues.length > 1 ? 'sm:grid-cols-2' : ''}`}>
          {account.venues.map((venue) => (
            <article className='rounded-[24px] border border-line-subtle bg-panel p-5 shadow-card' key={venue.id}>
              <div className='flex items-start gap-3'>
                <span className='grid size-10 shrink-0 place-items-center rounded-full bg-panel-muted text-foreground-secondary'>
                  <MapPinIcon className='size-5' />
                </span>
                <div className='min-w-0'>
                  <h3 className='truncate text-sm font-black sm:text-base'>{venue.name}</h3>
                  {venue.category && (
                    <p className='mt-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-foreground-label'>
                      {formatCategory(venue.category)}
                    </p>
                  )}
                  <p className='mt-2 text-xs leading-5 text-foreground-secondary sm:text-sm'>{formatAddress(venue)}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className='mt-4 rounded-[24px] border border-line-subtle bg-panel p-5 text-sm leading-6 text-foreground-muted shadow-card'>
          Visit any participating venue and scan its loyalty tag. Venues near your most visited city will appear here.
        </div>
      )}
    </section>
  );
}

function formatAddress(venue: Venue) {
  const street = [venue.addressLine1, venue.addressLine2].filter(Boolean).join(', ');
  const locality = [venue.postalCode, venue.city].filter(Boolean).join(' ');
  return [street, locality, venue.countryCode].filter(Boolean).join(' · ') || 'Address coming soon';
}

function formatCategory(category: string) {
  return category.replace(/[-_]/g, ' ');
}
