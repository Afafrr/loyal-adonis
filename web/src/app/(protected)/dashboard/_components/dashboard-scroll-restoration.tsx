'use client';

import { useLayoutEffect } from 'react';

const dashboardScrollPositionKey = 'loyalty-dashboard-scroll-position';

export function DashboardScrollRestoration() {
  useLayoutEffect(() => {
    const savedScrollPosition = sessionStorage.getItem(dashboardScrollPositionKey);

    if (!savedScrollPosition) {
      return;
    }

    sessionStorage.removeItem(dashboardScrollPositionKey);
    const scrollPosition = Number(savedScrollPosition);

    if (Number.isFinite(scrollPosition) && scrollPosition >= 0) {
      window.scrollTo(0, scrollPosition);
    }
  }, []);

  return null;
}
