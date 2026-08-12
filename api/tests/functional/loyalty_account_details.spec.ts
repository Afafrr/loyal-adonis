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

test.group('Loyalty account details', () => {
  test('requires authentication', async ({ client }) => {
    const response = await client.get('/api/v1/me/loyalty_accounts/1')

    response.assertStatus(401)
  })

  test('returns the signed-in user account detail', async ({ client, assert }) => {
    const user = await User.create({
      email: 'member-detail@example.com',
      encryptedPassword: 'password123',
    })
    const company = await Company.create({ name: 'Coffee Co.' })
    const loyaltyProgram = await LoyaltyProgram.create({
      companyId: company.id,
      name: 'Coffee stamps',
      rewardTitle: 'Free coffee',
      stampsRequired: 5,
      active: true,
    })
    const mainVenue = await Venue.create({
      companyId: company.id,
      name: 'Main Street',
      category: 'cafe',
      addressLine1: '12 Main Street',
      postalCode: '00-001',
      city: 'Warsaw',
      countryCode: 'PL',
    })
    await Venue.create({
      companyId: company.id,
      name: 'Riverside',
      addressLine1: '8 River Road',
      postalCode: '00-002',
      city: 'Warsaw',
      countryCode: 'PL',
    })
    const krakowVenue = await Venue.create({
      companyId: company.id,
      name: 'Old Town',
      addressLine1: '4 Market Square',
      postalCode: '30-001',
      city: 'Krakow',
      countryCode: 'PL',
    })
    const tag = await NfcTag.create({
      venueId: mainVenue.id,
      identifier: '041C6432A91234',
      active: true,
      lastAcceptedCounter: 6,
    })
    const krakowTag = await NfcTag.create({
      venueId: krakowVenue.id,
      identifier: '041C6432A95678',
      active: true,
      lastAcceptedCounter: 2,
    })
    const loyaltyAccount = await LoyaltyAccount.create({
      userId: user.id,
      loyaltyProgramId: loyaltyProgram.id,
    })

    for (let counter = 1; counter <= 4; counter += 1) {
      await Stamp.create({
        loyaltyAccountId: loyaltyAccount.id,
        nfcTagId: tag.id,
        nfcCounter: counter,
        createdAt: DateTime.fromISO(`2026-08-0${counter}T12:00:00Z`),
      })
    }
    for (let counter = 1; counter <= 2; counter += 1) {
      await Stamp.create({
        loyaltyAccountId: loyaltyAccount.id,
        nfcTagId: krakowTag.id,
        nfcCounter: counter,
        createdAt: DateTime.fromISO(`2026-08-0${counter + 4}T12:00:00Z`),
      })
    }

    const availableReward = await EarnedReward.create({
      loyaltyAccountId: loyaltyAccount.id,
      rewardTitleSnapshot: 'Free coffee',
      stampsRequiredSnapshot: 5,
      earnedAt: DateTime.fromISO('2026-08-05T12:00:00Z'),
    })
    await EarnedReward.create({
      loyaltyAccountId: loyaltyAccount.id,
      rewardTitleSnapshot: 'Redeemed coffee',
      stampsRequiredSnapshot: 5,
      earnedAt: DateTime.fromISO('2026-08-04T12:00:00Z'),
      redeemedAt: DateTime.fromISO('2026-08-04T13:00:00Z'),
    })

    const login = await signIn(client, user.email, 'password123')
    const response = await client
      .get(`/api/v1/me/loyalty_accounts/${loyaltyAccount.id}`)
      .header('Cookie', sessionCookie(login))

    response.assertStatus(200)
    const body = response.body() as {
      loyaltyAccount: {
        id: number
        program: { stampCount: number }
        primaryCity: string | null
        venueCount: number
        venues: Array<{ name: string }>
        availableRewards: Array<{ id: number; title: string }>
        recentStamps: Array<{ id: number; createdAt: string; venue: { name: string } }>
      }
    }

    assert.equal(body.loyaltyAccount.id, Number(loyaltyAccount.id))
    assert.equal(body.loyaltyAccount.program.stampCount, 0)
    assert.equal(body.loyaltyAccount.primaryCity, 'Warsaw')
    assert.equal(body.loyaltyAccount.venueCount, 3)
    assert.deepEqual(
      body.loyaltyAccount.venues.map((venue) => venue.name),
      ['Main Street', 'Riverside']
    )
    assert.deepEqual(body.loyaltyAccount.availableRewards, [
      {
        id: Number(availableReward.id),
        title: 'Free coffee',
        earnedAt: '2026-08-05T12:00:00.000Z',
      },
    ])
    assert.lengthOf(body.loyaltyAccount.recentStamps, 5)
    assert.equal(body.loyaltyAccount.recentStamps[0].id > 0, true)
    assert.equal(body.loyaltyAccount.recentStamps[0].createdAt, '2026-08-06T12:00:00.000Z')
    assert.deepEqual(body.loyaltyAccount.recentStamps[0].venue, {
      id: Number(krakowVenue.id),
      name: 'Old Town',
    })
  })

  test('uses the newest stamp and then alphabetical order to break primary city ties', async ({
    client,
    assert,
  }) => {
    const user = await User.create({
      email: 'city-tiebreaker@example.com',
      encryptedPassword: 'password123',
    })
    const firstCompany = await Company.create({ name: 'First Coffee Co.' })
    const firstProgram = await LoyaltyProgram.create({
      companyId: firstCompany.id,
      name: 'First coffee stamps',
      rewardTitle: 'Free coffee',
      stampsRequired: 10,
      active: true,
    })
    const warsawVenue = await Venue.create({
      companyId: firstCompany.id,
      name: 'Warsaw',
      city: 'Warsaw',
    })
    const krakowVenue = await Venue.create({
      companyId: firstCompany.id,
      name: 'Krakow',
      city: 'Krakow',
    })
    const warsawTag = await NfcTag.create({
      venueId: warsawVenue.id,
      identifier: '041C6432A90001',
      active: true,
      lastAcceptedCounter: 2,
    })
    const krakowTag = await NfcTag.create({
      venueId: krakowVenue.id,
      identifier: '041C6432A90002',
      active: true,
      lastAcceptedCounter: 2,
    })
    const firstAccount = await LoyaltyAccount.create({
      userId: user.id,
      loyaltyProgramId: firstProgram.id,
    })
    await Stamp.create({
      loyaltyAccountId: firstAccount.id,
      nfcTagId: warsawTag.id,
      nfcCounter: 1,
      createdAt: DateTime.fromISO('2026-08-01T12:00:00Z'),
    })
    await Stamp.create({
      loyaltyAccountId: firstAccount.id,
      nfcTagId: warsawTag.id,
      nfcCounter: 2,
      createdAt: DateTime.fromISO('2026-08-02T12:00:00Z'),
    })
    await Stamp.create({
      loyaltyAccountId: firstAccount.id,
      nfcTagId: krakowTag.id,
      nfcCounter: 1,
      createdAt: DateTime.fromISO('2026-08-03T12:00:00Z'),
    })
    await Stamp.create({
      loyaltyAccountId: firstAccount.id,
      nfcTagId: krakowTag.id,
      nfcCounter: 2,
      createdAt: DateTime.fromISO('2026-08-04T12:00:00Z'),
    })

    const secondCompany = await Company.create({ name: 'Second Coffee Co.' })
    const secondProgram = await LoyaltyProgram.create({
      companyId: secondCompany.id,
      name: 'Second coffee stamps',
      rewardTitle: 'Free tea',
      stampsRequired: 10,
      active: true,
    })
    const gdanskVenue = await Venue.create({
      companyId: secondCompany.id,
      name: 'Gdansk',
      city: 'Gdansk',
    })
    const secondWarsawVenue = await Venue.create({
      companyId: secondCompany.id,
      name: 'Warsaw Central',
      city: 'Warsaw',
    })
    const gdanskTag = await NfcTag.create({
      venueId: gdanskVenue.id,
      identifier: '041C6432A90003',
      active: true,
      lastAcceptedCounter: 1,
    })
    const secondWarsawTag = await NfcTag.create({
      venueId: secondWarsawVenue.id,
      identifier: '041C6432A90004',
      active: true,
      lastAcceptedCounter: 1,
    })
    const secondAccount = await LoyaltyAccount.create({
      userId: user.id,
      loyaltyProgramId: secondProgram.id,
    })
    const matchingTimestamp = DateTime.fromISO('2026-08-05T12:00:00Z')
    await Stamp.create({
      loyaltyAccountId: secondAccount.id,
      nfcTagId: gdanskTag.id,
      nfcCounter: 1,
      createdAt: matchingTimestamp,
    })
    await Stamp.create({
      loyaltyAccountId: secondAccount.id,
      nfcTagId: secondWarsawTag.id,
      nfcCounter: 1,
      createdAt: matchingTimestamp,
    })

    const login = await signIn(client, user.email, 'password123')
    const [newestStampResponse, alphabeticalResponse] = await Promise.all([
      client
        .get(`/api/v1/me/loyalty_accounts/${firstAccount.id}`)
        .header('Cookie', sessionCookie(login)),
      client
        .get(`/api/v1/me/loyalty_accounts/${secondAccount.id}`)
        .header('Cookie', sessionCookie(login)),
    ])

    newestStampResponse.assertStatus(200)
    alphabeticalResponse.assertStatus(200)
    assert.equal(newestStampResponse.body().loyaltyAccount.primaryCity, 'Krakow')
    assert.equal(alphabeticalResponse.body().loyaltyAccount.primaryCity, 'Gdansk')
  })

  test('returns no primary city or venues when the account has no stamps', async ({
    client,
    assert,
  }) => {
    const user = await User.create({
      email: 'member-without-stamps@example.com',
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
    await Venue.create({ companyId: company.id, name: 'Main Street', city: 'Warsaw' })
    const loyaltyAccount = await LoyaltyAccount.create({
      userId: user.id,
      loyaltyProgramId: loyaltyProgram.id,
    })

    const login = await signIn(client, user.email, 'password123')
    const response = await client
      .get(`/api/v1/me/loyalty_accounts/${loyaltyAccount.id}`)
      .header('Cookie', sessionCookie(login))

    response.assertStatus(200)
    const body = response.body() as {
      loyaltyAccount: { primaryCity: string | null; venueCount: number; venues: unknown[] }
    }
    assert.equal(body.loyaltyAccount.primaryCity, null)
    assert.equal(body.loyaltyAccount.venueCount, 1)
    assert.deepEqual(body.loyaltyAccount.venues, [])
  })

  test('does not reveal another user loyalty account', async ({ client }) => {
    const user = await User.create({
      email: 'member-owner@example.com',
      encryptedPassword: 'password123',
    })
    const otherUser = await User.create({
      email: 'member-stranger@example.com',
      encryptedPassword: 'password123',
    })
    const company = await Company.create({ name: 'Coffee Co.' })
    const loyaltyProgram = await LoyaltyProgram.create({
      companyId: company.id,
      name: 'Coffee stamps',
      rewardTitle: 'Free coffee',
      stampsRequired: 5,
      active: true,
    })
    const otherAccount = await LoyaltyAccount.create({
      userId: otherUser.id,
      loyaltyProgramId: loyaltyProgram.id,
    })

    const login = await signIn(client, user.email, 'password123')
    const response = await client
      .get(`/api/v1/me/loyalty_accounts/${otherAccount.id}`)
      .header('Cookie', sessionCookie(login))

    response.assertStatus(404)
    response.assertBody({ error: 'Loyalty account not found.' })
  })
})
