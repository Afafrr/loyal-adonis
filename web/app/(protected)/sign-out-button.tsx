'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignOutIcon } from '../_components/icons';
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
        <SignOutIcon className='size-5' />
      </button>
      {error && (
        <p className='px-5 pb-4 text-[11px] text-danger sm:px-6' role='alert'>
          {error}
        </p>
      )}
    </div>
  );
}
