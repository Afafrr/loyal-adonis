import { ViewTransition, type ReactNode } from 'react';

export function LoyaltyAccountShell({ children, transitionName }: { children: ReactNode; transitionName: string }) {
  return (
    <ViewTransition default='none' name={transitionName} share='loyalty-card-morph'>
      <section className='mx-4 mb-6 rounded-[45px] border border-line-subtle bg-panel px-4 pb-7 pt-4 shadow-card sm:mx-auto sm:max-w-4xl sm:rounded-none sm:border-0 sm:bg-transparent sm:px-12 sm:pb-16 sm:pt-6 sm:shadow-none md:px-10'>
        {children}
      </section>
    </ViewTransition>
  );
}
