import Link from 'next/link';
import { PageTitle } from '@/components/ui/page-title';
import { routes } from '@/lib/api/routes';
import { VenueSearch } from './_components/venue-search';
import { dashboardFilters, getDashboard } from '../dashboard/_lib/owner-dashboard';

export default async function BusinessVenuesPage({ searchParams }: PageProps<'/business/venues'>) {
  const filters = dashboardFilters(await searchParams);
  const dashboard = await getDashboard(filters);

  if (dashboard.view === 'company_selection') {
    return (
      <section className='mx-auto max-w-5xl px-4 pb-12 pt-2 sm:px-12 sm:pb-16 sm:pt-6 md:px-10'>
        <PageTitle>Choose a company</PageTitle>
        <div className='mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          {dashboard.companies.map((company) => (
            <Link
              className='rounded-dashboard-card border border-line-subtle bg-panel px-5 py-5 text-lg font-black shadow-card transition hover:border-line-hover hover:bg-panel-subtle'
              href={`${routes.businessVenues}?companyId=${company.id}`}
              key={company.id}
            >
              {company.name}
            </Link>
          ))}
        </div>
      </section>
    );
  }

  if (dashboard.view === 'empty') {
    return (
      <section className='mx-auto max-w-5xl px-4 pb-12 pt-2 sm:px-12 sm:pb-16 sm:pt-6 md:px-10'>
        <PageTitle>No venues available</PageTitle>
        <p className='mt-3 text-sm text-foreground-secondary'>You do not currently have access to any business venues.</p>
      </section>
    );
  }

  return (
    <section className='mx-auto max-w-5xl px-4 pb-12 pt-2 sm:px-12 sm:pb-16 sm:pt-6 md:px-10'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <p className='mb-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-foreground-label sm:text-xs'>Business area</p>
          <PageTitle>Venues</PageTitle>
        </div>
        <Link className='text-sm font-bold text-brand transition hover:text-foreground' href={`${routes.businessDashboard}?companyId=${dashboard.company.id}`}>
          Back to dashboard
        </Link>
      </div>
      <p className='mt-3 text-sm text-foreground-secondary'>{dashboard.company.name} · {dashboard.venues.length} venues in your access scope</p>
      <VenueSearch venues={dashboard.venues} />
    </section>
  );
}
