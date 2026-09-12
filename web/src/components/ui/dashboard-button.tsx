'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { routes } from '@/lib/api/routes';

interface DashboardButtonProps {
  href: string | null;
  desktopLabel: string;
  mobileLabel: string;
}

export function DashboardButton({ href, desktopLabel, mobileLabel }: DashboardButtonProps) {
  const pathname = usePathname();

  if (!href) {
    return null;
  }

  const isBusinessDashboard = pathname.startsWith(routes.businessDashboard);
  const buttonHref = isBusinessDashboard ? routes.dashboard : href;
  const buttonDesktopLabel = isBusinessDashboard ? 'User dashboard' : desktopLabel;
  const buttonMobileLabel = isBusinessDashboard ? 'User' : mobileLabel;

  return (
    <Link
      className='rounded-full bg-panel px-3 py-2 text-xs font-bold text-white shadow-control transition hover:border-line-hover sm:px-4 sm:py-2.5 sm:text-sm'
      href={buttonHref}
    >
      <span className='sm:hidden'>{buttonMobileLabel}</span>
      <span className='hidden sm:inline'>{buttonDesktopLabel}</span>
    </Link>
  );
}
