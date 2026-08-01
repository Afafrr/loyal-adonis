import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
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
    <div className='flex items-center gap-2.5 text-[15px] font-semibold tracking-[-0.03em]'>
      <span className='grid size-7 place-items-center rounded-[8px_8px_8px_2px] bg-[#1f2924] text-[12px] font-bold text-white'>
        L
      </span>
      <span>loyal nest</span>
    </div>
  );
}

export default async function ProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <main className='min-h-screen bg-[#f7f8f6] text-[#202a25]'>
      <nav className='mx-auto flex max-w-4xl items-center justify-between px-6 py-7'>
        <Brand />
        <div className='flex items-center gap-4'>
          <p className='hidden text-[12px] text-[#7a837e] sm:block'>{user.email}</p>
          <SignOutButton />
        </div>
      </nav>
      {children}
    </main>
  );
}
