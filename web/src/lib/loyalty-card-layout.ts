export function getLoyaltyCardLayoutIds(loyaltyAccountId: number) {
  const card = `loyalty-card-${loyaltyAccountId}`;

  return {
    card,
    title: `${card}-title`,
  };
}
