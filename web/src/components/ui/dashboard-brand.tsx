'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { routes } from '@/lib/api/routes';
import { brandOutfit } from '@/lib/fonts';

export function DashboardBrand() {
  const pathname = usePathname();
  const isBusinessDashboard = pathname.startsWith(routes.businessDashboard);

  return (
    <Link
      href={isBusinessDashboard ? routes.businessDashboard : routes.dashboard}
      className={`${brandOutfit.className} flex items-center gap-2.5 text-[14px] font-bold tracking-[-0.03em] text-brand lg:gap-3 lg:text-[16px]`}
      aria-label={isBusinessDashboard ? 'Loyal Nest business dashboard' : 'Loyal Nest dashboard'}
    >
      <span>loyal nest</span>
    </Link>
  );
}
