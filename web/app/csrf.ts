import { routes } from './routes';

const xsrfCookieName = 'XSRF-TOKEN=';

function getXsrfToken() {
  return document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(xsrfCookieName))
    ?.slice(xsrfCookieName.length);
}

/**
 * Shield writes an encrypted XSRF-TOKEN cookie on every safe backend request.
 * Prime that cookie through the public health route, then mirror it in the
 * header required for state-changing requests.
 */
export async function csrfHeaders() {
  if (!getXsrfToken()) {
    const response = await fetch(routes.api.health, { credentials: 'include' });

    if (!response.ok) {
      throw new Error('Unable to prepare a secure request. Please try again.');
    }
  }

  const token = getXsrfToken();
  if (!token) {
    throw new Error('Unable to prepare a secure request. Please try again.');
  }

  return { 'X-XSRF-TOKEN': token };
}
