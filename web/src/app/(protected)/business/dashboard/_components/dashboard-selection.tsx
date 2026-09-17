import Link from 'next/link';
import { MapPinIcon } from '@/components/ui/icons';
import { routes } from '@/lib/api/routes';
import type { BusinessVenue } from '../_lib/dashboard';
import { DashboardHeading, DashboardPage } from './dashboard-ui';

export function CompanySelection({ companies }: { companies: Array<{ id: number; name: string }> }) {
  return (
    <DashboardPage>
      <DashboardHeading eyebrow='Business area' title='Choose a company' />
      <p className='mt-3 text-sm text-foreground-secondary'>
        Select the company whose loyalty program you want to review.
      </p>
      <div className='mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
        {companies.map((company) => (
          <Link
            className='rounded-dashboard-card border border-line-subtle bg-panel px-5 py-5 shadow-card transition hover:border-line-hover hover:bg-panel-subtle'
            href={`?companyId=${company.id}`}
            key={company.id}
          >
            <p className='text-lg font-black'>{company.name}</p>
            <p className='mt-2 text-sm font-semibold text-foreground-secondary'>
              Open dashboard <span aria-hidden='true'>→</span>
            </p>
          </Link>
        ))}
      </div>
    </DashboardPage>
  );
}

export function VenueSelection({
  company,
  venues,
}: {
  company: { id: number; name: string };
  venues: BusinessVenue[];
}) {
  const switchCompanyLink = (
    <Link className='text-sm font-bold text-brand transition hover:text-foreground' href={routes.businessDashboard}>
      Switch company
    </Link>
  );

  return (
    <DashboardPage>
      <DashboardHeading aside={switchCompanyLink} eyebrow={company.name} title='Choose a venue' />
      <p className='mt-3 text-sm text-foreground-secondary'>Select the venue whose dashboard you want to open.</p>
      <div className='mt-7 grid gap-3 sm:grid-cols-2'>
        {venues.map((venue) => (
          <VenueOption companyId={company.id} key={venue.id} venue={venue} />
        ))}
      </div>
    </DashboardPage>
  );
}

export function EmptyDashboard() {
  return (
    <DashboardPage>
      <DashboardHeading eyebrow='Business area' title='No business dashboard yet' />
      <p className='mt-3 text-sm text-foreground-secondary'>
        You do not currently have access to a company or venue dashboard.
      </p>
    </DashboardPage>
  );
}

function VenueOption({ companyId, venue }: { companyId: number; venue: BusinessVenue }) {
  const location = [venue.addressLine1, venue.city].filter(Boolean).join(', ');

  return (
    <Link
      className='flex items-center gap-4 rounded-dashboard-card border border-line-subtle bg-panel px-5 py-5 shadow-card transition hover:border-line-hover hover:bg-panel-subtle'
      href={`${routes.businessDashboard}?companyId=${companyId}&venueId=${venue.id}`}
    >
      <span className='grid size-11 shrink-0 place-items-center rounded-full bg-panel-muted text-foreground-tertiary'>
        <MapPinIcon className='size-5' />
      </span>
      <span className='min-w-0 flex-1'>
        <span className='block truncate text-lg font-black'>{venue.name}</span>
        <span className='mt-1 block truncate text-sm text-foreground-secondary'>
          {location || venue.category || 'Location details unavailable'}
        </span>
      </span>
      <span aria-hidden='true' className='text-foreground-tertiary'>
        →
      </span>
    </Link>
  );
}
