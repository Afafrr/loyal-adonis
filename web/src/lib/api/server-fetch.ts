import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { routes } from '@/lib/api/routes';

const sessionCookieName = '_loyal_session';

export class AuthenticatedApiError extends Error {
  constructor(public readonly status: number) {
    super(`Authenticated API request failed with status ${status}.`);
    this.name = 'AuthenticatedApiError';
  }
}

export async function authenticatedFetch(url: string, init: RequestInit = {}) {
  const cookieStore = await cookies();

  if (!cookieStore.has(sessionCookieName)) {
    redirect(routes.signIn);
  }

  const requestHeaders = new Headers(init.headers);
  requestHeaders.set('Accept', 'application/json');
  requestHeaders.set('Cookie', cookieStore.toString());

  const response = await fetch(url, {
    ...init,
    headers: requestHeaders,
    cache: 'no-store',
  });

  if (response.status === 401) {
    redirect(routes.signIn);
  }

  if (!response.ok) {
    throw new AuthenticatedApiError(response.status);
  }

  return response;
}
