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
  locations: Array<{
    id: number;
    name: string;
    lastVisitedAt: string;
    stampCount: number;
  }>;
}
