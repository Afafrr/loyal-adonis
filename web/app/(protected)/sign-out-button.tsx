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
    <div>
      <button
        className='flex min-h-14 w-full items-center justify-between gap-4 px-5 text-left text-sm font-bold text-danger transition hover:bg-panel-subtle disabled:cursor-wait disabled:opacity-60 sm:px-6 sm:text-[15px]'
        onClick={signOut}
        disabled={signingOut}
      >
        <span>{signingOut ? 'Signing out…' : 'Sign out'}</span>
        <svg className='size-5' viewBox='0 0 24 24' fill='none' aria-hidden='true'>
          <path d='M14 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-3M10 12h11m0 0-3-3m3 3-3 3' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' />
        </svg>
      </button>
      {error && (
        <p className='px-5 pb-4 text-[11px] text-danger sm:px-6' role='alert'>
          {error}
        </p>
      )}
    </div>
  );
}
