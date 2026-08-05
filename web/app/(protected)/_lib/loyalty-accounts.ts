import { cache } from 'react';
import { serverRoutes } from '../../routes';
import type { LoyaltyAccount } from '../dashboard/loyalty-accounts/types';
import { authenticatedFetch } from './authenticated-fetch';

export const getLoyaltyAccounts = cache(async (): Promise<LoyaltyAccount[]> => {
  const response = await authenticatedFetch(serverRoutes.api.loyaltyAccounts);
  const data = (await response.json()) as { loyaltyAccounts: LoyaltyAccount[] };
  return data.loyaltyAccounts;
});
