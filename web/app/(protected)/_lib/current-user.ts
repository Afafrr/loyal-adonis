import { cache } from 'react';
import { serverRoutes } from '../../routes';
import { authenticatedFetch } from './authenticated-fetch';

export interface CurrentUser {
  id: number;
  email: string;
  firstName: string | null;
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
