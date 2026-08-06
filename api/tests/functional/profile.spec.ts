import Company from '#models/company'
import EarnedReward from '#models/earned_reward'
import LoyaltyAccount from '#models/loyalty_account'
import LoyaltyProgram from '#models/loyalty_program'
import NfcTag from '#models/nfc_tag'
import Stamp from '#models/stamp'
import User from '#models/user'
import Venue from '#models/venue'
import { sessionCookie, signIn } from '#tests/helpers/http'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

test.group('Profile', () => {
  test('returns the authenticated user profile', async ({ client }) => {
    const user = await User.create({
      email: 'marta@example.com',
      encryptedPassword: 'password123',
      firstName: 'Marta',
      phoneE164: '+48501123456',
      phoneVerifiedAt: DateTime.fromISO('2026-08-04T12:00:00Z'),
      createdAt: DateTime.fromISO('2026-08-01T08:00:00Z'),
    })
    const activeCompany = await Company.create({ name: 'Active Coffee' })
    const activeProgram = await LoyaltyProgram.create({
      companyId: activeCompany.id,
      name: 'Coffee stamps',
      rewardTitle: 'Free coffee',
      stampsRequired: 10,
      active: true,
    })
    const activeVenue = await Venue.create({ companyId: activeCompany.id, name: 'Downtown' })
    const activeTag = await NfcTag.create({ venueId: activeVenue.id, identifier: 'PROFILE-ACTIVE' })
    const activeAccount = await LoyaltyAccount.create({
      userId: user.id,
      loyaltyProgramId: activeProgram.id,
    })
    const firstActiveStamp = await Stamp.create({
      loyaltyAccountId: activeAccount.id,
      nfcTagId: activeTag.id,
      nfcCounter: 1,
    })
    const secondActiveStamp = await Stamp.create({
      loyaltyAccountId: activeAccount.id,
      nfcTagId: activeTag.id,
      nfcCounter: 2,
    })
    const earnedReward = await EarnedReward.create({
      loyaltyAccountId: activeAccount.id,
      rewardTitleSnapshot: 'Free coffee',
      stampsRequiredSnapshot: 2,
      earnedAt: secondActiveStamp.createdAt,
    })
    firstActiveStamp.earnedRewardId = earnedReward.id
    secondActiveStamp.earnedRewardId = earnedReward.id
    await firstActiveStamp.save()
    await secondActiveStamp.save()

    const inactiveCompany = await Company.create({ name: 'Inactive Bakery' })
    const inactiveProgram = await LoyaltyProgram.create({
      companyId: inactiveCompany.id,
      name: 'Bakery stamps',
      rewardTitle: 'Free pastry',
      stampsRequired: 5,
      active: false,
    })
    const inactiveVenue = await Venue.create({ companyId: inactiveCompany.id, name: 'Old Town' })
    const inactiveTag = await NfcTag.create({
      venueId: inactiveVenue.id,
      identifier: 'PROFILE-INACTIVE',
    })
    const inactiveAccount = await LoyaltyAccount.create({
      userId: user.id,
      loyaltyProgramId: inactiveProgram.id,
    })
    await Stamp.create({
      loyaltyAccountId: inactiveAccount.id,
      nfcTagId: inactiveTag.id,
      nfcCounter: 1,
    })

    const login = await signIn(client, user.email, 'password123')
    const response = await client.get('/api/v1/me/profile').header('Cookie', sessionCookie(login))

    response.assertStatus(200)
    response.assertBody({
      id: Number(user.id),
      email: 'marta@example.com',
      firstName: 'Marta',
      phoneE164: '+48501123456',
      phoneVerifiedAt: '2026-08-04T12:00:00.000Z',
      createdAt: '2026-08-01T08:00:00.000Z',
      visitCount: 3,
      activeProgramCount: 1,
      availableRewardCount: 1,
    })
  })

  test('requires authentication', async ({ client, assert }) => {
    const response = await client.get('/api/v1/me/profile')

    response.assertStatus(401)
    assert.deepEqual(response.body(), {
      error: 'You need to sign in or sign up before continuing.',
    })
  })
})
