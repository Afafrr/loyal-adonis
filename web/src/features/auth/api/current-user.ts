import { cache } from 'react';
import { serverRoutes } from '@/lib/api/routes';
import { authenticatedFetch } from '@/lib/api/server-fetch';

export type MembershipRole = 'admin' | 'company_owner' | 'venue_manager' | 'venue_staff';

export interface UserMembership {
  role: MembershipRole;
  companyId: number | null;
  venueId: number | null;
  permissions: string[];
}

export interface CurrentUser {
  id: number;
  email: string;
  firstName: string | null;
  memberships: UserMembership[];
}

export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const response = await authenticatedFetch(serverRoutes.api.me);
  return response.json() as Promise<CurrentUser>;
});

export function userDisplayName(user: Pick<CurrentUser, 'email' | 'firstName'>) {
  return user.firstName?.trim() || user.email.split('@')[0] || user.email;
}

export function userInitial(user: Pick<CurrentUser, 'email' | 'firstName'>) {
  return userDisplayName(user).charAt(0).toLocaleUpperCase();
}
