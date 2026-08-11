import { cache } from 'react';
import { serverRoutes } from '@/lib/api/routes';
import { authenticatedFetch } from '@/lib/api/server-fetch';

export interface LoyaltyAccount {
  id: number;
  program: {
    id: number;
    name: string;
    rewardTitle: string;
    stampsRequired: number;
    stampCount: number;
  };
  company: {
    id: number;
    name: string;
  };
}

export const getLoyaltyAccounts = cache(async (): Promise<LoyaltyAccount[]> => {
  const response = await authenticatedFetch(serverRoutes.api.loyaltyAccounts);
  const data = (await response.json()) as { loyaltyAccounts: LoyaltyAccount[] };
  return data.loyaltyAccounts;
});
