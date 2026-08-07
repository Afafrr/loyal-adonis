import { cache } from 'react';
import { serverRoutes } from '../../routes';
import { authenticatedFetch } from './authenticated-fetch';

export interface AvailableReward {
  id: number;
  title: string;
  earnedAt: string;
  loyaltyAccountId: number;
  company: {
    id: number;
    name: string;
  };
  program: {
    id: number;
    name: string;
  };
}

export const getLoyaltyRewards = cache(async (): Promise<AvailableReward[]> => {
  const response = await authenticatedFetch(serverRoutes.api.loyaltyRewards);
  const data = (await response.json()) as { rewards: AvailableReward[] };
  return data.rewards;
});
