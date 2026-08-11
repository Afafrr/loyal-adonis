import type { ReactNode } from 'react';

export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className='text-3xl font-bold leading-none tracking-[-0.06em] sm:text-5xl lg:text-[44px]'>{children}</h1>;
}
