const loyaltyColors = [
  { backgroundClass: 'bg-reward-coffee/20', fillClass: 'bg-reward-coffee' },
  { backgroundClass: 'bg-reward-burgundy/20', fillClass: 'bg-reward-burgundy' },
  { backgroundClass: 'bg-reward-olive/20', fillClass: 'bg-reward-olive' },
  { backgroundClass: 'bg-reward-navy/20', fillClass: 'bg-reward-navy' },
] as const;

/**
 * Temporary presentation mapping until a visual color is stored on the loyalty program.
 * A company receives the same color on every render without changing API data.
 */
export function getLoyaltyColor(companyId: number) {
  return loyaltyColors[Math.max(companyId - 1, 0) % loyaltyColors.length];
}
