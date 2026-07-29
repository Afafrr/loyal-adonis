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
    <div className='text-right'>
      <button className='rounded-[10px] border border-[#d7ddd9] bg-white px-4 py-2.5 text-[11px] font-semibold text-[#4f5e56] transition hover:border-[#aeb9b2] disabled:cursor-wait disabled:opacity-60' onClick={signOut} disabled={signingOut}>
        {signingOut ? 'Signing out...' : 'Sign out'}
      </button>
      {error && <p className='mt-2 text-[11px] text-[#9a6259]' role='alert'>{error}</p>}
    </div>
  );
}
