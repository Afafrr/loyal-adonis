import 'server-only';

import { cache } from 'react';
import { serverRoutes } from '@/lib/api/routes';
import { authenticatedFetch } from '@/lib/api/server-fetch';

export interface LatestActivity {
  loyaltyAccountId: number;
  visitedAt: string;
  company: {
    id: number;
    name: string;
  };
  venue: {
    id: number;
    name: string;
  };
}

export const getLatestActivity = cache(async (): Promise<LatestActivity | null> => {
  const response = await authenticatedFetch(serverRoutes.api.latestActivity);
  const data = (await response.json()) as { latestActivity: LatestActivity | null };
  return data.latestActivity;
});
