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
