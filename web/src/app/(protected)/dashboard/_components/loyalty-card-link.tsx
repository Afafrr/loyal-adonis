'use client';

import Link from 'next/link';
import { ViewTransition, type ReactNode } from 'react';
import {
  useLoyaltyCardNavigation,
  type LoyaltyCardNavigationSummary,
} from '../../_components/loyalty-card-navigation-context';

interface LoyaltyCardLinkProps {
  ariaLabelledby: string;
  children: ReactNode;
  className: string;
  href: string;
  id: string;
  navigationSummary: LoyaltyCardNavigationSummary;
  transitionName: string;
}

export function LoyaltyCardLink({
  ariaLabelledby,
  children,
  className,
  href,
  id,
  navigationSummary,
  transitionName,
}: LoyaltyCardLinkProps) {
  const { selectCard } = useLoyaltyCardNavigation();

  return (
    <ViewTransition default='none' name={transitionName} share='loyalty-card-morph'>
      <Link
        aria-labelledby={ariaLabelledby}
        className={`${className} relative`}
        href={href}
        id={id}
        onNavigate={() => selectCard(navigationSummary)}
        transitionTypes={['loyalty-card-expand']}
      >
        {children}
      </Link>
    </ViewTransition>
  );
}
