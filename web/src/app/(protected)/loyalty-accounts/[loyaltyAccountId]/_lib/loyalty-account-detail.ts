import 'server-only';

import { cache } from 'react';
import { serverRoutes } from '@/lib/api/routes';
import { authenticatedFetch, AuthenticatedApiError } from '@/lib/api/server-fetch';

export interface LoyaltyAccountDetail {
  id: number;
  company: {
    id: number;
    name: string;
  };
  program: {
    id: number;
    name: string;
    rewardTitle: string;
    stampsRequired: number;
    stampCount: number;
  };
  primaryCity: string | null;
  venueCount: number;
  venues: Venue[];
  availableRewards: AvailableReward[];
  recentStamps: RecentStamp[];
}

export interface Venue {
  id: number;
  name: string;
  category: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  postalCode: string | null;
  city: string | null;
  countryCode: string | null;
}

interface AvailableReward {
  id: number;
  title: string;
  earnedAt: string;
}

interface RecentStamp {
  id: number;
  createdAt: string;
  venue: {
    id: number;
    name: string;
  };
}

export const getLoyaltyAccountDetail = cache(async (loyaltyAccountId: number): Promise<LoyaltyAccountDetail | null> => {
  try {
    const response = await authenticatedFetch(serverRoutes.api.loyaltyAccount(loyaltyAccountId));
    const data = (await response.json()) as { loyaltyAccount: LoyaltyAccountDetail };
    return data.loyaltyAccount;
  } catch (error) {
    if (error instanceof AuthenticatedApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
});
