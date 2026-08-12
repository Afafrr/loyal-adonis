'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitCredentials, type AuthMode } from '@/features/auth/api/auth-api';
import { useAuthRedirect } from '@/features/auth/hooks/use-auth-redirect';
import { routes } from '@/lib/api/routes';
import { brandOutfit } from '@/lib/fonts';

function Brand() {
  return (
    <div className={`${brandOutfit.className} flex items-center gap-2.5 text-[15px] font-semibold tracking-[-0.03em] sm:text-base`}>
      <span className='grid size-7 place-items-center rounded-[8px_8px_8px_2px] bg-brand text-[12px] font-bold text-white'>
        L
      </span>
      <span>Loyal Nest</span>
    </div>
  );
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const checkingSession = useAuthRedirect();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isSignUp = mode === 'sign-up';
  const disabled = loading || checkingSession;

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) return setError('Please complete all required fields.');
    if (isSignUp && password !== confirmation) return setError('Passwords do not match.');

    setLoading(true);
    try {
      await submitCredentials(mode, { email: normalizedEmail, password, passwordConfirmation: confirmation });
      router.replace(routes.dashboard);
    } catch (submissionError) {
      console.log('Error submitting credentials:', submissionError);
      setError(submissionError instanceof Error ? submissionError.message : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  const inputClass =
    'h-11 w-full rounded-[10px] border border-line bg-panel px-3.5 text-[13px] outline-none transition placeholder:text-placeholder focus:border-focus focus:ring-4 focus:ring-focus/10 disabled:opacity-60 sm:text-sm';

  return (
    <main className='flex min-h-dvh items-center justify-center bg-canvas px-3 py-4 text-foreground sm:px-5 sm:py-10'>
      <section className='w-full max-w-103 rounded-[16px] border border-line-subtle bg-panel px-5 py-6 shadow-form min-[380px]:px-7 sm:rounded-[18px] sm:px-10 sm:py-8'>
        <Brand />
        <h1 className='mt-7 text-[25px] font-semibold leading-[1.1] tracking-[-0.055em] sm:mt-9 sm:text-[27px]'>
          {isSignUp ? 'Create your account' : 'Sign in'}
        </h1>
        <form onSubmit={handleSubmit} noValidate className='mt-6 grid gap-2'>
          <label className='mt-1 text-[11px] font-semibold text-foreground-secondary sm:text-xs' htmlFor='email'>
            Email address
          </label>
          <input
            className={inputClass}
            id='email'
            type='email'
            autoComplete='email'
            placeholder='you@example.com'
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={disabled}
          />
          <label className='mt-2 text-[11px] font-semibold text-foreground-secondary sm:text-xs' htmlFor='password'>
            Password
          </label>
          <div className='relative'>
            <input
              className={`${inputClass} pr-16`}
              id='password'
              type={showPassword ? 'text' : 'password'}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              placeholder='••••••••'
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={disabled}
            />
            <button
              className='absolute right-3 top-1/2 -translate-y-1/2 px-2 text-[10px] font-semibold text-foreground-interactive-muted sm:text-[11px]'
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              disabled={disabled}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {isSignUp && (
            <>
              <label className='mt-2 text-[11px] font-semibold text-foreground-secondary sm:text-xs' htmlFor='confirmation'>
                Confirm password
              </label>
              <input
                className={inputClass}
                id='confirmation'
                type={showPassword ? 'text' : 'password'}
                autoComplete='new-password'
                placeholder='••••••••'
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                disabled={disabled}
              />
            </>
          )}
          {error && (
            <p className='mt-1 text-[11px] text-danger sm:text-xs' role='alert'>
              {error}
            </p>
          )}
          <button
            className='mt-3 h-11 rounded-[10px] bg-brand text-[13px] font-semibold text-white transition hover:bg-brand-hover disabled:cursor-wait disabled:opacity-60 sm:text-sm'
            disabled={disabled}
          >
            {loading || checkingSession ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>
        <div className='mt-5 flex flex-wrap items-center justify-center gap-x-1 gap-y-2 text-center text-[12px] text-foreground-label sm:text-sm'>
          <span>{isSignUp ? 'Already have an account?' : 'New to Loyal Nest?'}</span>
          <Link
            className='font-semibold text-foreground-secondary underline decoration-stamp-empty underline-offset-4 '
            href={isSignUp ? routes.signIn : routes.signUp}
          >
            {isSignUp ? 'Sign in' : 'Create account'}
          </Link>
        </div>
      </section>
    </main>
  );
}
