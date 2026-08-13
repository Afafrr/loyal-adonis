import Link from 'next/link';
import { routes } from '@/lib/api/routes';

export default function LoyaltyAccountNotFound() {
  return (
    <section className='mx-auto max-w-2xl px-4 pb-12 pt-12 text-center sm:px-12 sm:pt-20'>
      <p className='text-xs font-extrabold uppercase tracking-[0.14em] text-foreground-label'>Loyalty card</p>
      <h1 className='mt-3 text-3xl font-black tracking-[-0.05em] sm:text-5xl'>Card not found</h1>
      <p className='mx-auto mt-4 max-w-md text-sm leading-6 text-foreground-muted'>
        This loyalty card does not exist or does not belong to your account.
      </p>
      <Link className='mt-7 inline-flex rounded-full bg-brand px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-hover' href={routes.dashboard}>
        Back to your rewards
      </Link>
    </section>
  );
}
