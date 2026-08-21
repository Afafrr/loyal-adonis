import type { ReactNode } from 'react';
import { getLoyaltyCardTransitionNames } from '@/lib/loyalty-card-transition';
import { LoyaltyAccountShell } from './_components/loyalty-account-shell';

export default async function LoyaltyAccountLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ loyaltyAccountId: string }>;
}) {
  const { loyaltyAccountId: loyaltyAccountIdParam } = await params;
  const loyaltyAccountId = Number(loyaltyAccountIdParam);
  const transitionNames = getLoyaltyCardTransitionNames(loyaltyAccountId);

  return <LoyaltyAccountShell transitionName={transitionNames.card}>{children}</LoyaltyAccountShell>;
}
