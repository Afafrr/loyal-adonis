import Company from '#models/company'
import LoyaltyAccount from '#models/loyalty_account'
import LoyaltyProgram from '#models/loyalty_program'
import NfcTag from '#models/nfc_tag'
import Stamp from '#models/stamp'
import User from '#models/user'
import Venue from '#models/venue'
import { sessionCookie, signIn } from '#tests/helpers/http'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

test.group('Latest activity', () => {
  test('returns the signed-in user latest stamp with its venue', async ({ client }) => {
    const user = await User.create({
      email: 'member@example.com',
      encryptedPassword: 'password123',
    })
    const otherUser = await User.create({
      email: 'other@example.com',
      encryptedPassword: 'password123',
    })
    const company = await Company.create({ name: 'Coffee Co.' })
    const loyaltyProgram = await LoyaltyProgram.create({
      companyId: company.id,
      name: 'Coffee stamps',
      rewardTitle: 'Free coffee',
      stampsRequired: 10,
      active: true,
    })
    const olderVenue = await Venue.create({ companyId: company.id, name: 'Main Street' })
    const latestVenue = await Venue.create({ companyId: company.id, name: 'Old Town' })
    const olderTag = await NfcTag.create({
      venueId: olderVenue.id,
      identifier: 'LATEST-ACTIVITY-OLDER',
      active: true,
      lastAcceptedCounter: 1,
    })
    const latestTag = await NfcTag.create({
      venueId: latestVenue.id,
      identifier: 'LATEST-ACTIVITY-NEWER',
      active: true,
      lastAcceptedCounter: 2,
    })
    const loyaltyAccount = await LoyaltyAccount.create({
      userId: user.id,
      loyaltyProgramId: loyaltyProgram.id,
    })
    const otherAccount = await LoyaltyAccount.create({
      userId: otherUser.id,
      loyaltyProgramId: loyaltyProgram.id,
    })

    await Stamp.create({
      loyaltyAccountId: loyaltyAccount.id,
      nfcTagId: olderTag.id,
      nfcCounter: 1,
      createdAt: DateTime.fromISO('2026-08-03T10:00:00Z'),
    })
    await Stamp.create({
      loyaltyAccountId: loyaltyAccount.id,
      nfcTagId: latestTag.id,
      nfcCounter: 1,
      createdAt: DateTime.fromISO('2026-08-04T10:00:00Z'),
    })
    await Stamp.create({
      loyaltyAccountId: otherAccount.id,
      nfcTagId: latestTag.id,
      nfcCounter: 2,
      createdAt: DateTime.fromISO('2026-08-05T10:00:00Z'),
    })

    const login = await signIn(client, user.email, 'password123')
    const response = await client
      .get('/api/v1/me/latest_activity')
      .header('Cookie', sessionCookie(login))

    response.assertStatus(200)
    response.assertBody({
      latestActivity: {
        loyaltyAccountId: Number(loyaltyAccount.id),
        visitedAt: '2026-08-04T10:00:00.000Z',
        company: {
          id: Number(company.id),
          name: 'Coffee Co.',
        },
        venue: {
          id: Number(latestVenue.id),
          name: 'Old Town',
        },
      },
    })
  })

  test('returns null when the signed-in user has no stamps', async ({ client }) => {
    const user = await User.create({
      email: 'no-activity@example.com',
      encryptedPassword: 'password123',
    })
    const login = await signIn(client, user.email, 'password123')
    const response = await client
      .get('/api/v1/me/latest_activity')
      .header('Cookie', sessionCookie(login))

    response.assertStatus(200)
    response.assertBody({ latestActivity: null })
  })

  test('requires authentication', async ({ client }) => {
    const response = await client.get('/api/v1/me/latest_activity')

    response.assertStatus(401)
  })
})
