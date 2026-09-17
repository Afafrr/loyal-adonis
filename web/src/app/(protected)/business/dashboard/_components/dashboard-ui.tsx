import type { ReactNode } from 'react';
import { PageTitle } from '@/components/ui/page-title';

export function DashboardPage({ children }: { children: ReactNode }) {
  return <section className='mx-auto max-w-5xl px-4 pb-12 pt-2 sm:px-12 sm:pb-16 sm:pt-6 md:px-10'>{children}</section>;
}

export function DashboardHeading({
  aside,
  eyebrow,
  subtitle,
  title,
}: {
  aside?: ReactNode;
  eyebrow?: ReactNode;
  subtitle?: ReactNode;
  title: ReactNode;
}) {
  return (
    <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
      <div>
        {eyebrow && (
          <p className='mb-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-foreground-label sm:text-xs'>
            {eyebrow}
          </p>
        )}
        <PageTitle>{title}</PageTitle>
        {subtitle && <div className='mt-2 text-sm font-semibold text-foreground-secondary'>{subtitle}</div>}
      </div>
      {aside && <div className='flex items-center gap-3'>{aside}</div>}
    </div>
  );
}

export function DashboardPanel({ children }: { children: ReactNode }) {
  return (
    <section className='rounded-dashboard-card border border-line-subtle bg-panel px-5 py-5 shadow-card sm:px-7 sm:py-7'>
      {children}
    </section>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className='text-xs font-bold uppercase tracking-[0.2em] text-foreground-tertiary'>{children}</p>;
}
