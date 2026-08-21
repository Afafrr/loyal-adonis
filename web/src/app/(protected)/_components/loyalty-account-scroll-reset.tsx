'use client';

import { useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';

export function LoyaltyAccountScrollReset() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (/^\/loyalty-accounts\/\d+$/.test(pathname)) {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}
