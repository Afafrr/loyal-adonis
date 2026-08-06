import Company from '#models/company'
import EarnedReward from '#models/earned_reward'
import LoyaltyAccount from '#models/loyalty_account'
import LoyaltyProgram from '#models/loyalty_program'
import User from '#models/user'
import { sessionCookie, signIn } from '#tests/helpers/http'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

test.group('Loyalty rewards', () => {
  test('requires authentication', async ({ client }) => {
    const response = await client.get('/api/v1/me/loyalty_rewards')

    response.assertStatus(401)
  })

  test('lists only the signed-in user available rewards from newest to oldest', async ({
    client,
    assert,
  }) => {
    const user = await User.create({
      email: 'reward-member@example.com',
      encryptedPassword: 'password123',
    })
    const otherUser = await User.create({
      email: 'other-reward-member@example.com',
      encryptedPassword: 'password123',
    })
    const company = await Company.create({ name: 'Reward Coffee Co.' })
    const loyaltyProgram = await LoyaltyProgram.create({
      companyId: company.id,
      name: 'Coffee stamps',
      rewardTitle: 'Free coffee',
      stampsRequired: 2,
      active: true,
    })
    const loyaltyAccount = await LoyaltyAccount.create({
      userId: user.id,
      loyaltyProgramId: loyaltyProgram.id,
    })
    const otherLoyaltyAccount = await LoyaltyAccount.create({
      userId: otherUser.id,
      loyaltyProgramId: loyaltyProgram.id,
    })
    const olderReward = await EarnedReward.create({
      loyaltyAccountId: loyaltyAccount.id,
      rewardTitleSnapshot: 'Free coffee',
      stampsRequiredSnapshot: 2,
      earnedAt: DateTime.fromISO('2026-08-03T12:00:00Z'),
    })
    const latestReward = await EarnedReward.create({
      loyaltyAccountId: loyaltyAccount.id,
      rewardTitleSnapshot: 'Free coffee',
      stampsRequiredSnapshot: 2,
      earnedAt: DateTime.fromISO('2026-08-04T12:00:00Z'),
    })
    await EarnedReward.create({
      loyaltyAccountId: loyaltyAccount.id,
      rewardTitleSnapshot: 'Redeemed coffee',
      stampsRequiredSnapshot: 2,
      earnedAt: DateTime.fromISO('2026-08-05T12:00:00Z'),
      redeemedAt: DateTime.fromISO('2026-08-05T13:00:00Z'),
    })
    await EarnedReward.create({
      loyaltyAccountId: otherLoyaltyAccount.id,
      rewardTitleSnapshot: 'Other user coffee',
      stampsRequiredSnapshot: 2,
      earnedAt: DateTime.fromISO('2026-08-06T12:00:00Z'),
    })

    const login = await signIn(client, user.email, 'password123')
    const response = await client
      .get('/api/v1/me/loyalty_rewards')
      .header('Cookie', sessionCookie(login))

    response.assertStatus(200)
    response.assertBody({
      rewards: [
        {
          id: Number(latestReward.id),
          title: 'Free coffee',
          earnedAt: '2026-08-04T12:00:00.000Z',
          loyaltyAccountId: Number(loyaltyAccount.id),
          company: { id: Number(company.id), name: 'Reward Coffee Co.' },
          program: { id: Number(loyaltyProgram.id), name: 'Coffee stamps' },
        },
        {
          id: Number(olderReward.id),
          title: 'Free coffee',
          earnedAt: '2026-08-03T12:00:00.000Z',
          loyaltyAccountId: Number(loyaltyAccount.id),
          company: { id: Number(company.id), name: 'Reward Coffee Co.' },
          program: { id: Number(loyaltyProgram.id), name: 'Coffee stamps' },
        },
      ],
    })

    assert.notEqual(Number(latestReward.id), Number(olderReward.id))
  })
})
