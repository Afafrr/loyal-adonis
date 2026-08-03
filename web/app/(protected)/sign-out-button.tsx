'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { csrfHeaders } from '../csrf';
import { routes } from '../routes';

export function SignOutButton() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');

  async function signOut() {
    setSigningOut(true);
    setError('');
    try {
      const response = await fetch(routes.api.signOut, {
        method: 'DELETE',
        credentials: 'include',
        headers: await csrfHeaders(),
      });
      if (!response.ok && response.status !== 401) throw new Error('Unable to sign out. Please try again.');
      router.replace(routes.signIn);
      router.refresh();
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : 'Unable to sign out. Please try again.');
      setSigningOut(false);
    }
  }

  return (
    <div className='shrink-0 text-right'>
      <button
        className='min-h-10 whitespace-nowrap rounded-[10px] border border-line bg-panel px-3 text-[11px] font-semibold text-foreground-secondary transition hover:border-line-hover disabled:cursor-wait disabled:opacity-60 sm:px-4 sm:text-xs'
        onClick={signOut}
        disabled={signingOut}
      >
        {signingOut ? 'Signing out...' : 'Sign out'}
      </button>
      {error && (
        <p className='mt-2 max-w-48 text-[11px] text-danger' role='alert'>
          {error}
        </p>
      )}
    </div>
  );
}
