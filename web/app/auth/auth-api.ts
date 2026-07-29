import { csrfHeaders } from '../csrf';
import { routes } from '../routes';

export type AuthMode = 'sign-in' | 'sign-up';

interface SubmitCredentials {
  email: string;
  password: string;
  passwordConfirmation?: string;
}

function firstErrorMessage(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(firstErrorMessage).find(Boolean);
  if (!value || typeof value !== 'object') return undefined;

  if ('message' in value && typeof value.message === 'string') return value.message;
  return Object.values(value).map(firstErrorMessage).find(Boolean);
}

function validationMessage(body: unknown): string | undefined {
  if (!body || typeof body !== 'object' || !('errors' in body)) return undefined;
  return firstErrorMessage(body.errors);
}

export async function submitCredentials(mode: AuthMode, credentials: SubmitCredentials) {
  const isSignUp = mode === 'sign-up';
  const response = await fetch(isSignUp ? routes.api.register : routes.api.signIn, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(await csrfHeaders()),
    },
    body: JSON.stringify({
      user: {
        email: credentials.email,
        password: credentials.password,
        ...(isSignUp ? { password_confirmation: credentials.passwordConfirmation } : {}),
      },
    }),
  });

  if (response.ok) return;

  const body: unknown = await response.json().catch(() => null);
  throw new Error(
    response.status === 401
      ? 'Invalid email or password.'
      : validationMessage(body) ??
        (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string' ? body.error : undefined) ??
        'Something went wrong. Please try again.',
  );
}
