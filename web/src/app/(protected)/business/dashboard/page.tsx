import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { routes } from '@/lib/api/routes';
import { DashboardOverview } from './_components/dashboard-overview';
import { CompanySelection, EmptyDashboard, VenueSelection } from './_components/dashboard-selection';
import { dashboardFilters, getDashboard, getDashboardStats } from './_lib/dashboard';

export const metadata: Metadata = {
  title: 'Business dashboard | Loyal Nest',
  description: 'Overview of your company loyalty program',
};

export default async function BusinessDashboardPage({ searchParams }: PageProps<'/business/dashboard'>) {
  const filters = dashboardFilters(await searchParams);
  const dashboard = await getDashboard(filters);

  if (dashboard.view === 'company_selection') {
    return <CompanySelection companies={dashboard.companies} />;
  }

  if (dashboard.view === 'empty') {
    return <EmptyDashboard />;
  }

  if (dashboard.scope.type === 'venue' && filters.venueId === undefined) {
    if (dashboard.venues.length === 1) {
      redirectToVenue(dashboard.company.id, dashboard.venues[0].id);
    }

    return <VenueSelection company={dashboard.company} venues={dashboard.venues} />;
  }

  const statsResult = await getDashboardStats(filters);
  const selectedVenue = filters.venueId
    ? dashboard.venues.find((venue) => venue.id === filters.venueId)
    : undefined;

  return (
    <DashboardOverview
      dashboard={dashboard}
      selectedVenue={selectedVenue}
      showCompanySwitcher={filters.companyId !== undefined}
      statsResult={statsResult}
    />
  );
}

function redirectToVenue(companyId: number, venueId: number): never {
  redirect(`${routes.businessDashboard}?companyId=${companyId}&venueId=${venueId}`);
}
