'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { routes } from '../routes';

export function useAuthRedirect() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function redirectAuthenticatedUser() {
      try {
        const response = await fetch(routes.api.me, {
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
        });
        if (response.ok) router.replace(routes.dashboard);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          // The form remains usable when the session check cannot complete.
        }
      } finally {
        if (!controller.signal.aborted) setCheckingSession(false);
      }
    }

    void redirectAuthenticatedUser();
    return () => controller.abort();
  }, [router]);

  return checkingSession;
}
