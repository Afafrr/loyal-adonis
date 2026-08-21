'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

export interface LoyaltyCardNavigationSummary {
  loyaltyAccountId: number;
  companyId: number;
  companyName: string;
}

interface LoyaltyCardNavigationContextValue {
  selectedCard: LoyaltyCardNavigationSummary | null;
  selectCard: (card: LoyaltyCardNavigationSummary) => void;
}

const LoyaltyCardNavigationContext = createContext<LoyaltyCardNavigationContextValue | null>(null);

export function LoyaltyCardNavigationProvider({ children }: { children: ReactNode }) {
  const [selectedCard, selectCard] = useState<LoyaltyCardNavigationSummary | null>(null);

  return (
    <LoyaltyCardNavigationContext value={{ selectedCard, selectCard }}>
      {children}
    </LoyaltyCardNavigationContext>
  );
}

export function useLoyaltyCardNavigation() {
  const context = useContext(LoyaltyCardNavigationContext);

  if (!context) {
    throw new Error('useLoyaltyCardNavigation must be used within LoyaltyCardNavigationProvider');
  }

  return context;
}
