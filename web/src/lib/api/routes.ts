const browserApiOrigin = process.env.NEXT_PUBLIC_API_ORIGIN ??
  (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3333');
const serverApiOrigin = process.env.API_ORIGIN ?? browserApiOrigin;

type BusinessDashboardFilters = { companyId?: number; venueId?: number };
type BusinessDashboardStatsFilters = BusinessDashboardFilters & { range?: '7d' | '30d' | '90d' };

function apiRoutesFor(origin: string) {
  const apiBaseUrl = `${origin}/api/v1`;
  const businessDashboardUrl = (
    path: 'dashboard' | 'dashboard/stats',
    filters: BusinessDashboardStatsFilters = {},
  ) => {
    const query = new URLSearchParams();

    if (filters.companyId !== undefined) query.set('companyId', String(filters.companyId));
    if (filters.venueId !== undefined) query.set('venueId', String(filters.venueId));
    if (filters.range !== undefined) query.set('range', filters.range);

    const search = query.toString();
    return `${apiBaseUrl}/business/${path}${search ? `?${search}` : ''}`;
  };

  return {
    health: `${origin}/up`,
    me: `${apiBaseUrl}/me`,
    profile: `${apiBaseUrl}/me/profile`,
    latestActivity: `${apiBaseUrl}/me/latest_activity`,
    loyaltyAccounts: `${apiBaseUrl}/me/loyalty_accounts`,
    loyaltyAccount: (loyaltyAccountId: number) => `${apiBaseUrl}/me/loyalty_accounts/${loyaltyAccountId}`,
    loyaltyRewards: `${apiBaseUrl}/me/loyalty_rewards`,
    businessDashboard: (filters?: BusinessDashboardFilters) =>
      businessDashboardUrl('dashboard', filters),
    businessDashboardStats: (filters?: BusinessDashboardStatsFilters) =>
      businessDashboardUrl('dashboard/stats', filters),
    register: `${apiBaseUrl}/users`,
    signIn: `${apiBaseUrl}/users/sign_in`,
    signOut: `${apiBaseUrl}/users/sign_out`,
  };
}

export const routes = {
  home: '/',
  signIn: '/sign-in',
  signUp: '/sign-up',
  dashboard: '/dashboard',
  loyaltyAccount: (loyaltyAccountId: number) => `/loyalty-accounts/${loyaltyAccountId}`,
  businessDashboard: '/business/dashboard',
  businessVenues: '/business/venues',
  profile: '/profile',
  api: apiRoutesFor(browserApiOrigin),
} as const;

export const serverRoutes = {
  api: apiRoutesFor(serverApiOrigin),
} as const;
