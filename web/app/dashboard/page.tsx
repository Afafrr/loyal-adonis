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

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <main className='min-h-screen bg-[#f7f8f6] text-[#202a25]'>
      <nav className='mx-auto flex max-w-4xl items-center justify-between px-6 py-7'>
        <Brand />
        <SignOutButton />
      </nav>
      <section className='mx-auto max-w-3xl px-6 pb-16 pt-24'>
        <p className='mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#87918b]'>Your workspace</p>
        <h1 className='text-4xl font-semibold leading-none tracking-[-0.06em] sm:text-5xl'>Welcome.</h1>
        <p className='mt-3 text-[13px] text-[#7a837e]'>{user.email}</p>
        <div className='mt-10 rounded-[18px] border border-[#e1e5e2] bg-white p-7 shadow-[0_18px_50px_rgba(32,42,37,0.04)] sm:p-9'>
          <h2 className='text-[16px] font-semibold'>Your dashboard is ready.</h2>
          <p className='mt-2 max-w-md text-[13px] leading-6 text-[#7a837e]'>
            Your loyalty overview will appear here once you create your first programme.
          </p>
        </div>
      </section>
    </main>
  );
}
