const browserApiOrigin = process.env.NEXT_PUBLIC_API_ORIGIN ?? 'http://localhost:3333';
const serverApiOrigin = process.env.API_ORIGIN ?? browserApiOrigin;

function apiRoutesFor(origin: string) {
  const apiBaseUrl = `${origin}/api/v1`;
  return {
    health: `${origin}/up`,
    me: `${apiBaseUrl}/me`,
    profile: `${apiBaseUrl}/me/profile`,
    latestActivity: `${apiBaseUrl}/me/latest_activity`,
    loyaltyAccounts: `${apiBaseUrl}/me/loyalty_accounts`,
    loyaltyRewards: `${apiBaseUrl}/me/loyalty_rewards`,
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
  profile: '/profile',
  api: apiRoutesFor(browserApiOrigin),
} as const;

export const serverRoutes = {
  api: apiRoutesFor(serverApiOrigin),
} as const;
