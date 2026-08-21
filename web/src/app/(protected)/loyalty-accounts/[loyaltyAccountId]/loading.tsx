'use client';

import { useParams } from 'next/navigation';
import { ViewTransition } from 'react';
import { getLoyaltyCardTransitionNames } from '@/lib/loyalty-card-transition';
import { useLoyaltyCardNavigation } from '../../_components/loyalty-card-navigation-context';
import { companyInitials } from '../../dashboard/_lib/company-initials';
import { getLoyaltyColor } from '../../dashboard/_lib/loyalty-color';

export default function LoyaltyAccountLoading() {
  const params = useParams<{ loyaltyAccountId: string }>();
  const { selectedCard } = useLoyaltyCardNavigation();
  const loyaltyAccountId = Number(params.loyaltyAccountId);
  const card = selectedCard?.loyaltyAccountId === loyaltyAccountId ? selectedCard : null;
  const loyaltyColor = card ? getLoyaltyColor(card.companyId) : null;
  const transitionNames = getLoyaltyCardTransitionNames(loyaltyAccountId);

  return (
    <div aria-busy='true'>
      <p className='sr-only' role='status'>
        Loading loyalty account
      </p>
      <div className='h-8 w-28 rounded-full bg-line-faint sm:h-5 sm:rounded' />

      <div className='border-b border-line-faint py-6 sm:border-b-0'>
        <div className='grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-5 sm:gap-x-6'>
          {card && loyaltyColor ? (
            <ViewTransition default='none' name={transitionNames.avatar} share='loyalty-card-avatar-morph'>
              <span
                aria-hidden='true'
                className={`grid size-20 place-items-center rounded-full text-2xl font-black text-white shadow-card sm:size-24 sm:text-3xl ${loyaltyColor.fillClass}`}
              >
                {companyInitials(card.companyName)}
              </span>
            </ViewTransition>
          ) : (
            <div className='size-20 rounded-full bg-line-faint motion-safe:animate-pulse sm:size-24' />
          )}
          <div className='min-w-0'>
            <div className='h-[15px] w-24 rounded bg-line-faint motion-safe:animate-pulse sm:h-4' />
            {card ? (
              <h1 className='mt-1 text-3xl font-black tracking-[-0.045em] sm:text-4xl'>{card.companyName}</h1>
            ) : (
              <div className='mt-1 h-9 max-w-sm rounded-lg bg-line-faint motion-safe:animate-pulse sm:h-10' />
            )}
          </div>

          <div className='col-span-2 space-y-3 sm:col-start-2'>
            <div className='h-5 max-w-xs rounded bg-line-faint motion-safe:animate-pulse sm:h-6' />
            <div className='h-6 max-w-xl rounded bg-line-faint motion-safe:animate-pulse sm:h-7' />
          </div>
        </div>
      </div>

      <div className='mt-6 space-y-6'>
        <div className='h-72 rounded-dashboard-card bg-panel-muted motion-safe:animate-pulse' />
        <div className='h-52 rounded-dashboard-card bg-panel-muted motion-safe:animate-pulse' />
        <div className='h-64 rounded-dashboard-card bg-panel-muted motion-safe:animate-pulse' />
      </div>
    </div>
  );
}
