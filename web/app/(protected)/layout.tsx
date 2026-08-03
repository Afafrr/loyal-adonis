import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { brandOutfit } from '../brand-fonts';
import { routes, serverRoutes } from '../routes';
import { SignOutButton } from './sign-out-button';

interface CurrentUser {
  email: string;
}

async function getCurrentUser(): Promise<CurrentUser> {
  const cookie = (await headers()).get('cookie');
  if (!cookie) redirect(routes.signIn);

  const response = await fetch(serverRoutes.api.me, {
    headers: { Cookie: cookie },
    cache: 'no-store',
  });

  if (!response.ok) redirect(routes.signIn);
  return response.json() as Promise<CurrentUser>;
}

function Brand() {
  return (
    <div
      className={`${brandOutfit.className} flex items-center gap-2.5 text-[15px] font-bold tracking-[-0.03em] text-red-700 sm:text-base`}
    >
      <span className='grid size-7 place-items-center rounded-[8px_8px_8px_2px] bg-brand text-[12px] font-bold text-white'>
        L
      </span>
      <span>loyal nest</span>
    </div>
  );
}

export default async function ProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <main className='min-h-screen bg-canvas text-foreground'>
      <nav className='mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 min-[380px]:px-5 sm:px-8 sm:py-5'>
        <div className='shrink-0'>
          <Brand />
        </div>
        <div className='flex min-w-0 items-center gap-4'>
          <p className='hidden min-w-0 truncate text-[12px] text-foreground-muted sm:block'>{user.email}</p>
          <SignOutButton />
        </div>
      </nav>
      {children}
    </main>
  );
}
