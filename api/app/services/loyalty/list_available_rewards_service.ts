import EarnedReward from '#models/earned_reward'

export async function listAvailableRewards(userId: number) {
  const rewards = await EarnedReward.query()
    .whereNull('redeemed_at')
    .whereHas('loyaltyAccount', (loyaltyAccountQuery) =>
      loyaltyAccountQuery.where('user_id', userId)
    )
    .orderBy('earned_at', 'desc')
    .orderBy('id', 'desc')
    .preload('loyaltyAccount', (loyaltyAccountQuery) =>
      loyaltyAccountQuery.preload('loyaltyProgram', (loyaltyProgramQuery) =>
        loyaltyProgramQuery.preload('company')
      )
    )

  return {
    rewards: rewards.map((reward) => ({
      id: Number(reward.id),
      title: reward.rewardTitleSnapshot,
      earnedAt: reward.earnedAt.toUTC().toISO()!,
      loyaltyAccountId: Number(reward.loyaltyAccountId),
      company: {
        id: Number(reward.loyaltyAccount.loyaltyProgram.company.id),
        name: reward.loyaltyAccount.loyaltyProgram.company.name,
      },
      program: {
        id: Number(reward.loyaltyAccount.loyaltyProgram.id),
        name: reward.loyaltyAccount.loyaltyProgram.name,
      },
    })),
  }
}
