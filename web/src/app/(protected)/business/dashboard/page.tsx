import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { GiftIcon, MapPinIcon, StampIcon, TrophyIcon } from '@/components/ui/icons';
import { PageTitle } from '@/components/ui/page-title';
import { routes } from '@/lib/api/routes';
import { dashboardFilters, getDashboard, getDashboardStats, type BusinessVenue } from './_lib/owner-dashboard';

export const metadata: Metadata = {
  title: 'Business dashboard | Loyal Nest',
  description: 'Overview of your company loyalty program',
};

const lifetimeStatCards = [
  { icon: <span className='text-lg'>◎</span>, key: 'customerCount', label: 'Total customers' },
  { icon: <StampIcon className='size-5' />, key: 'stampCount', label: 'Total stamps' },
  { icon: <TrophyIcon className='size-5' />, key: 'earnedRewardCount', label: 'Rewards earned' },
  { icon: <span className='text-lg'>⌁</span>, key: 'activeTagCount', label: 'Active NFC tags' },
] as const;

export default async function BusinessDashboardPage({ searchParams }: PageProps<'/business/dashboard'>) {
  const filters = dashboardFilters(await searchParams);
  const dashboard = await getDashboard(filters);

  if (dashboard.view === 'company_selection') {
    return <CompanySelection companies={dashboard.companies} />;
  }

  if (dashboard.view === 'empty') {
    return <EmptyDashboard />;
  }

  const { company, program, venues } = dashboard;
  const isVenueScoped = dashboard.scope.type === 'venue';

  if (isVenueScoped && filters.venueId === undefined) {
    if (venues.length === 1) {
      redirect(`${routes.businessDashboard}?companyId=${company.id}&venueId=${venues[0].id}`);
    }

    return <VenueSelection company={company} venues={venues} />;
  }

  const { stats, warnings } = await getDashboardStats(filters);
  const selectedVenueId = filters.venueId;
  const selectedVenue = selectedVenueId ? venues.find((venue) => venue.id === selectedVenueId) : undefined;
  const isVenueDashboard = selectedVenue !== undefined;
  const hasCompanyWideAccess = company.access.some((grant) => grant.permissions.includes('company.view'));

  return (
    <section className='mx-auto max-w-5xl px-4 pb-12 pt-2 sm:px-12 sm:pb-16 sm:pt-6 md:px-10'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <p className='mb-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-foreground-label sm:text-xs'>
            {isVenueDashboard ? 'Venue dashboard' : 'Business area'}
          </p>
          <PageTitle>{selectedVenue?.name ?? company.name}</PageTitle>
          {isVenueDashboard && <p className='mt-2 text-sm font-semibold text-foreground-secondary'>{company.name}</p>}
        </div>
        <div className='flex items-center gap-3'>
          <p className='text-sm font-semibold text-foreground-secondary'>
            {isVenueDashboard ? 'Venue overview' : 'Dashboard overview'}
          </p>
          {isVenueDashboard ? (
            <Link
              className='text-sm font-bold text-brand transition hover:text-foreground'
              href={hasCompanyWideAccess ? `${routes.businessDashboard}?companyId=${company.id}` : routes.businessDashboard}
            >
              {hasCompanyWideAccess ? 'Back to company' : 'Change venue'}
            </Link>
          ) : filters.companyId ? (
            <Link
              className='text-sm font-bold text-brand transition hover:text-foreground'
              href={routes.businessDashboard}
            >
              Switch company
            </Link>
          ) : null}
        </div>
      </div>

      <section className='mt-7 sm:mt-9'>
        <SectionLabel>All time</SectionLabel>
        <div className='mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-5'>
          {lifetimeStatCards.map((card) => (
            <StatCard icon={card.icon} key={card.key} label={card.label} value={stats[card.key]} />
          ))}
        </div>
      </section>

      {warnings.length > 0 && (
        <p className='mt-4 rounded-2xl border border-line-subtle bg-panel px-4 py-3 text-sm text-foreground-secondary'>
          Some statistics are temporarily unavailable.
        </p>
      )}

      <div className='mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]'>
        <section className='rounded-dashboard-card border border-line-subtle bg-panel px-5 py-5 shadow-card sm:px-7 sm:py-7'>
          <SectionLabel>Program</SectionLabel>
          {program ? (
            <div className='mt-5 flex items-start justify-between gap-4'>
              <div className='flex min-w-0 items-start gap-4'>
                <span className='grid size-12 shrink-0 place-items-center rounded-full bg-avatar text-avatar-foreground'>
                  <GiftIcon className='size-6' />
                </span>
                <div className='min-w-0'>
                  <h2 className='truncate text-xl font-black'>{program.name}</h2>
                  <p className='mt-1 truncate text-sm text-foreground-secondary'>{program.rewardTitle}</p>
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                  program.active ? 'bg-brand text-white' : 'bg-panel-muted text-foreground-muted'
                }`}
              >
                {program.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          ) : (
            <p className='mt-5 text-sm text-foreground-muted'>No loyalty program configured yet.</p>
          )}
          {program && (
            <p className='mt-6 border-t border-line-faint pt-4 text-sm text-foreground-secondary'>
              Customers receive a reward after{' '}
              <strong className='text-foreground'>{program.stampsRequired} stamps</strong>.
            </p>
          )}
        </section>

        {isVenueDashboard ? (
          <VenueDetails venue={selectedVenue} />
        ) : (
          <section className='rounded-dashboard-card border border-line-subtle bg-panel px-5 py-5 shadow-card sm:px-7 sm:py-7'>
            <div className='flex items-center justify-between gap-4'>
              <SectionLabel>Venues</SectionLabel>
              <span className='text-sm font-bold text-foreground-secondary'>{venues.length}</span>
            </div>
            <div className='mt-4 divide-y divide-line-faint'>
              {venues.length > 0 ? (
                venues.slice(0, 5).map((venue) => <VenueRow companyId={company.id} key={venue.id} venue={venue} />)
              ) : (
                <p className='py-3 text-sm text-foreground-muted'>No venues yet.</p>
              )}
            </div>
            {venues.length > 5 && (
              <Link
                className='mt-5 inline-flex text-sm font-bold text-brand transition hover:text-foreground'
                href={venuesUrl(company.id)}
              >
                View all {venues.length} venues <span aria-hidden='true'>&nbsp;→</span>
              </Link>
            )}
          </section>
        )}
      </div>
    </section>
  );
}

function VenueDetails({ venue }: { venue: BusinessVenue }) {
  const location = [venue.addressLine1, venue.city].filter(Boolean).join(', ');

  return (
    <section className='rounded-dashboard-card border border-line-subtle bg-panel px-5 py-5 shadow-card sm:px-7 sm:py-7'>
      <SectionLabel>Venue details</SectionLabel>
      <div className='mt-5 flex items-start gap-4'>
        <span className='grid size-12 shrink-0 place-items-center rounded-full bg-brand text-white'>
          <MapPinIcon className='size-6' />
        </span>
        <div className='min-w-0'>
          <h2 className='truncate text-xl font-black'>{venue.name}</h2>
          <p className='mt-1 text-sm text-foreground-secondary'>
            {location || 'Location details unavailable'}
          </p>
          {venue.category && <p className='mt-3 text-xs font-bold uppercase tracking-[0.16em] text-foreground-muted'>{venue.category}</p>}
        </div>
      </div>
    </section>
  );
}

function venuesUrl(companyId: number | undefined) {
  return companyId ? `${routes.businessVenues}?companyId=${companyId}` : routes.businessVenues;
}

function CompanySelection({ companies }: { companies: Array<{ id: number; name: string }> }) {
  return (
    <section className='mx-auto max-w-5xl px-4 pb-12 pt-2 sm:px-12 sm:pb-16 sm:pt-6 md:px-10'>
      <p className='mb-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-foreground-label sm:text-xs'>
        Business area
      </p>
      <PageTitle>Choose a company</PageTitle>
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
    </section>
  );
}

function VenueSelection({
  company,
  venues,
}: {
  company: { id: number; name: string };
  venues: BusinessVenue[];
}) {
  return (
    <section className='mx-auto max-w-5xl px-4 pb-12 pt-2 sm:px-12 sm:pb-16 sm:pt-6 md:px-10'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <p className='mb-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-foreground-label sm:text-xs'>
            {company.name}
          </p>
          <PageTitle>Choose a venue</PageTitle>
        </div>
        <Link className='text-sm font-bold text-brand transition hover:text-foreground' href={routes.businessDashboard}>
          Switch company
        </Link>
      </div>
      <p className='mt-3 text-sm text-foreground-secondary'>Select the venue whose dashboard you want to open.</p>
      <div className='mt-7 grid gap-3 sm:grid-cols-2'>
        {venues.map((venue) => {
          const location = [venue.addressLine1, venue.city].filter(Boolean).join(', ');

          return (
            <Link
              className='flex items-center gap-4 rounded-dashboard-card border border-line-subtle bg-panel px-5 py-5 shadow-card transition hover:border-line-hover hover:bg-panel-subtle'
              href={`${routes.businessDashboard}?companyId=${company.id}&venueId=${venue.id}`}
              key={venue.id}
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
        })}
      </div>
    </section>
  );
}

function EmptyDashboard() {
  return (
    <section className='mx-auto max-w-5xl px-4 pb-12 pt-2 sm:px-12 sm:pb-16 sm:pt-6 md:px-10'>
      <p className='mb-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-foreground-label sm:text-xs'>
        Business area
      </p>
      <PageTitle>No business dashboard yet</PageTitle>
      <p className='mt-3 text-sm text-foreground-secondary'>
        You do not currently have access to a company or venue dashboard.
      </p>
    </section>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | null }) {
  return (
    <section className='relative min-h-32 rounded-dashboard-card border border-line-subtle bg-panel px-4 py-4 shadow-card sm:px-5 sm:py-5'>
      <span className='absolute right-4 top-4 text-foreground-tertiary'>{icon}</span>
      <p className='mt-1 text-3xl font-black leading-none sm:text-4xl'>{value ?? '—'}</p>
      <p className='mt-3 max-w-24 text-xs font-semibold leading-4 text-foreground-secondary sm:text-sm'>{label}</p>
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className='text-xs font-bold uppercase tracking-[0.2em] text-foreground-tertiary'>{children}</p>;
}

function VenueRow({ companyId, venue }: { companyId: number; venue: BusinessVenue }) {
  const location = [venue.addressLine1, venue.city].filter(Boolean).join(', ');

  return (
    <Link
      className='flex items-center gap-3 py-3 first:pt-0 last:pb-0 transition hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2'
      href={`${routes.businessDashboard}?companyId=${companyId}&venueId=${venue.id}`}
    >
      <span className='grid size-10 shrink-0 place-items-center rounded-full bg-panel-muted text-foreground-tertiary'>
        <MapPinIcon className='size-5' />
      </span>
      <div className='min-w-0 flex-1'>
        <p className='truncate text-sm font-bold'>{venue.name}</p>
        <p className='truncate text-xs text-foreground-muted'>
          {location || venue.category || 'Location details unavailable'}
        </p>
      </div>
      <span aria-hidden='true' className='text-foreground-tertiary'>
        →
      </span>
    </Link>
  );
}
