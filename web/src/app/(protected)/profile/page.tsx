import type { Metadata } from 'next';
import { ChevronRightIcon } from '@/components/ui/icons';
import { PageTitle } from '@/components/ui/page-title';
import { userDisplayName, userInitial } from '@/features/auth/api/current-user';
import { SignOutButton } from '@/features/auth/components/sign-out-button';
import { getCurrentProfile } from './_lib/user-profile';

export const metadata: Metadata = {
  title: 'Profile | Loyal Nest',
  description: 'Your Loyal Nest profile and account summary',
};

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  const displayName = userDisplayName(profile);
  const memberSince = new Date(profile.createdAt).getUTCFullYear();

  return (
    <section className='mx-auto max-w-2xl px-4 pb-12 pt-4 min-[380px]:px-5 sm:px-12 sm:pb-16 sm:pt-6'>
      <div className='flex items-center justify-between gap-4'>
        <PageTitle>Profile</PageTitle>
        <span className='rounded-full border border-line-subtle bg-panel px-4 py-2 text-xs font-bold text-foreground-secondary shadow-[0_4px_12px_rgba(32,42,37,0.025)] sm:text-sm'>
          Edit
        </span>
      </div>

      <div className='mt-7 flex flex-col items-center sm:mt-9'>
        <div className='grid size-24 place-items-center rounded-full bg-[#ffc9aa] text-4xl font-black text-[#633a2a] shadow-[0_10px_30px_rgba(179,99,55,0.08)] sm:size-28 sm:text-5xl'>
          {userInitial(profile)}
        </div>
        <h2 className='mt-3 max-w-full truncate text-2xl font-extrabold tracking-[-0.035em] sm:text-3xl'>{displayName}</h2>
        <p className='mt-1 text-sm font-semibold text-foreground-muted sm:text-base'>Loyal Nest member since {memberSince}</p>
      </div>

      <div className='mt-6 flex items-end justify-between rounded-[26px] bg-brand px-8 py-5 text-white shadow-[0_16px_36px_rgba(32,42,37,0.1)] sm:mt-8 sm:px-12 sm:py-6'>
        <div>
          <p className='text-3xl font-black leading-none sm:text-4xl'>{profile.visitCount}</p>
          <p className='mt-1 text-[10px] font-extrabold uppercase tracking-[0.09em] text-white/65 sm:text-xs'>Visits</p>
        </div>
        <div className='text-right'>
          <p className='text-3xl font-black leading-none sm:text-4xl'>{profile.availableRewardCount}</p>
          <p className='mt-1 text-[10px] font-extrabold uppercase tracking-[0.09em] text-white/65 sm:text-xs'>Rewards</p>
        </div>
      </div>

      <p className='mb-3 mt-7 text-[11px] font-extrabold uppercase tracking-[0.14em] text-foreground-label sm:mt-9 sm:text-xs'>Account</p>
      <div className='overflow-hidden rounded-[24px] border border-line-subtle bg-panel shadow-[0_14px_36px_rgba(32,42,37,0.035)]'>
        <div className='flex min-h-14 items-center justify-between gap-4 border-b border-line-faint px-5 sm:px-6'>
          <span className='text-sm font-bold sm:text-[15px]'>Reward preferences</span>
          <ChevronRightIcon className='size-5 shrink-0 text-foreground-label' />
        </div>
        <div className='flex min-h-14 items-center justify-between gap-4 border-b border-line-faint px-5 sm:px-6'>
          <span className='text-sm font-bold sm:text-[15px]'>Help &amp; support</span>
          <ChevronRightIcon className='size-5 shrink-0 text-foreground-label' />
        </div>
        <SignOutButton />
      </div>
    </section>
  );
}
