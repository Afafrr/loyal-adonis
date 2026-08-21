export function getLoyaltyCardTransitionNames(loyaltyAccountId: number) {
  const card = `loyalty-card-${loyaltyAccountId}`;

  return {
    avatar: `${card}-avatar`,
    card,
  };
}
