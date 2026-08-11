import { cache } from 'react';
import { serverRoutes } from '@/lib/api/routes';
import { authenticatedFetch } from '@/lib/api/server-fetch';

export interface CurrentProfile {
  id: number;
  email: string;
  firstName: string | null;
  phoneE164: string | null;
  phoneVerifiedAt: string | null;
  createdAt: string;
  visitCount: number;
  activeProgramCount: number;
  availableRewardCount: number;
}

export const getCurrentProfile = cache(async (): Promise<CurrentProfile> => {
  const response = await authenticatedFetch(serverRoutes.api.profile);
  return response.json() as Promise<CurrentProfile>;
});
