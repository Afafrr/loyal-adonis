import Link from 'next/link';
import { brandOutfit } from '../brand-fonts';
import { routes } from '../routes';
import { getCurrentUser, userDisplayName, userInitial } from './_lib/current-user';

function Brand() {
  return (
    <Link
      href={routes.dashboard}
      className={`${brandOutfit.className} flex items-center gap-2.5 text-[15px] font-bold tracking-[-0.03em] text-red-700 sm:text-base`}
      aria-label='Loyal Nest dashboard'
    >
      <span className='grid size-7 place-items-center rounded-[8px_8px_8px_2px] bg-brand text-[12px] font-bold text-white'>
        L
      </span>
      <span>loyal nest</span>
    </Link>
  );
}

export default async function ProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  const displayName = userDisplayName(user);

  return (
    <main className='min-h-screen bg-canvas text-foreground'>
      <nav className='mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 min-[380px]:px-5 sm:px-8 sm:py-5'>
        <div className='shrink-0'>
          <Brand />
        </div>
        <Link
          className='flex min-w-0 items-center gap-2 rounded-full border border-line-subtle bg-panel py-1.5 pl-1.5 pr-1.5 shadow-[0_6px_18px_rgba(32,42,37,0.04)] transition hover:border-line-hover hover:bg-panel-subtle sm:gap-2.5 sm:pr-3.5'
          href={routes.profile}
          aria-label={`Open profile for ${displayName}`}
        >
          <span className='grid size-8 shrink-0 place-items-center rounded-full bg-[#ffc9aa] text-xs font-extrabold text-[#633a2a] sm:size-9 sm:text-sm'>
            {userInitial(user)}
          </span>
          <span className='hidden min-w-0 sm:block'>
            <span className='block max-w-36 truncate text-xs font-bold leading-4 text-foreground'>{displayName}</span>
            <span className='block max-w-36 truncate text-[10px] leading-3 text-foreground-muted'>{user.email}</span>
          </span>
          <svg className='hidden size-3.5 text-foreground-muted sm:block' viewBox='0 0 16 16' fill='none' aria-hidden='true'>
            <path d='m6 3 5 5-5 5' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' />
          </svg>
        </Link>
      </nav>
      {children}
    </main>
  );
}
