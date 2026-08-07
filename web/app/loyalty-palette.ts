export interface LoyaltyPaletteColor {
  rewardPanelClass: string;
  filledStampClass: string;
}

const loyaltyPalette: LoyaltyPaletteColor[] = [
  {
    rewardPanelClass: 'bg-reward-coffee',
    filledStampClass: 'bg-reward-coffee',
  },
  {
    rewardPanelClass: 'bg-reward-burgundy',
    filledStampClass: 'bg-reward-burgundy',
  },
  {
    rewardPanelClass: 'bg-reward-olive',
    filledStampClass: 'bg-reward-olive',
  },
  {
    rewardPanelClass: 'bg-reward-navy',
    filledStampClass: 'bg-reward-navy',
  },
];

/**
 * Temporary presentation mapping until a visual color is stored on the loyalty program.
 * A company receives the same color on every render without changing API data.
 */
export function getLoyaltyColor(companyId: number): LoyaltyPaletteColor {
  return loyaltyPalette[Math.max(companyId - 1, 0) % loyaltyPalette.length];
}
