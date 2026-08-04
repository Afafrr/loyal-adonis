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

test.group('Loyalty accounts', () => {
  test('lists only the signed-in user accounts with their programme and visited locations', async ({
    client,
    assert,
  }) => {
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
    const firstVenue = await Venue.create({ companyId: company.id, name: 'Main Street' })
    const secondVenue = await Venue.create({ companyId: company.id, name: 'Riverside' })
    const thirdVenue = await Venue.create({ companyId: company.id, name: 'Old Town' })
    const firstTag = await NfcTag.create({
      venueId: firstVenue.id,
      identifier: '041C6432A91190',
      active: true,
      lastAcceptedCounter: 1,
    })
    const secondTag = await NfcTag.create({
      venueId: secondVenue.id,
      identifier: '041C6432A91191',
      active: true,
      lastAcceptedCounter: 1,
    })
    const thirdTag = await NfcTag.create({
      venueId: thirdVenue.id,
      identifier: '041C6432A91192',
      active: true,
      lastAcceptedCounter: 1,
    })
    const loyaltyAccount = await LoyaltyAccount.create({
      userId: user.id,
      loyaltyProgramId: loyaltyProgram.id,
    })
    await LoyaltyAccount.create({ userId: otherUser.id, loyaltyProgramId: loyaltyProgram.id })
    await Stamp.create({
      loyaltyAccountId: loyaltyAccount.id,
      nfcTagId: firstTag.id,
      nfcCounter: 1,
      createdAt: DateTime.fromISO('2026-08-03T10:00:00Z'),
    })
    await Stamp.create({
      loyaltyAccountId: loyaltyAccount.id,
      nfcTagId: secondTag.id,
      nfcCounter: 1,
      createdAt: DateTime.fromISO('2026-08-01T10:00:00Z'),
    })
    await Stamp.create({
      loyaltyAccountId: loyaltyAccount.id,
      nfcTagId: secondTag.id,
      nfcCounter: 2,
      createdAt: DateTime.fromISO('2026-08-02T10:00:00Z'),
    })
    await Stamp.create({
      loyaltyAccountId: loyaltyAccount.id,
      nfcTagId: thirdTag.id,
      nfcCounter: 1,
      createdAt: DateTime.fromISO('2026-08-04T10:00:00Z'),
    })

    const login = await signIn(client, user.email, 'password123')
    const response = await client
      .get('/api/v1/me/loyalty_accounts')
      .header('Cookie', sessionCookie(login))

    response.assertStatus(200)
    response.assertBodyContains({
      loyaltyAccounts: [
        {
          id: Number(loyaltyAccount.id),
          program: {
            id: Number(loyaltyProgram.id),
            name: 'Coffee stamps',
            rewardTitle: 'Free coffee',
            stampsRequired: 10,
            stampCount: 4,
          },
          company: { id: Number(company.id), name: 'Coffee Co.' },
          locations: [
            {
              id: Number(thirdVenue.id),
              name: 'Old Town',
              lastVisitedAt: '2026-08-04T10:00:00.000Z',
              stampCount: 1,
            },
            {
              id: Number(firstVenue.id),
              name: 'Main Street',
              lastVisitedAt: '2026-08-03T10:00:00.000Z',
              stampCount: 1,
            },
          ],
        },
      ],
    })

    const body = response.body() as {
      loyaltyAccounts: Array<{
        locations: Array<{ lastVisitedAt: string; stampCount: number }>
        program: { stampCount: number }
      }>
    }
    assert.lengthOf(body.loyaltyAccounts[0].locations, 2)
    assert.equal(body.loyaltyAccounts[0].program.stampCount, 4)
    assert.equal(body.loyaltyAccounts[0].locations[0].stampCount, 1)
    assert.equal(body.loyaltyAccounts[0].locations[0].lastVisitedAt, '2026-08-04T10:00:00.000Z')
  })

  test('returns recent locations only for the first three companies', async ({
    client,
    assert,
  }) => {
    const user = await User.create({
      email: 'three-companies@example.com',
      encryptedPassword: 'password123',
    })

    for (let index = 1; index <= 4; index += 1) {
      const company = await Company.create({ name: `Company ${index}` })
      const loyaltyProgram = await LoyaltyProgram.create({
        companyId: company.id,
        name: `Program ${index}`,
        rewardTitle: `Reward ${index}`,
        stampsRequired: 10,
        active: true,
      })

      const venue = await Venue.create({ companyId: company.id, name: `Venue ${index}` })
      const tag = await NfcTag.create({
        venueId: venue.id,
        identifier: `COMPANY-TAG-${index}`,
        active: true,
        lastAcceptedCounter: 1,
      })
      const loyaltyAccount = await LoyaltyAccount.create({
        userId: user.id,
        loyaltyProgramId: loyaltyProgram.id,
        createdAt: DateTime.fromISO(`2026-08-0${index}T10:00:00Z`),
      })
      await Stamp.create({
        loyaltyAccountId: loyaltyAccount.id,
        nfcTagId: tag.id,
        nfcCounter: 1,
        createdAt: DateTime.fromISO(`2026-08-0${index}T11:00:00Z`),
      })
    }

    const login = await signIn(client, user.email, 'password123')
    const response = await client
      .get('/api/v1/me/loyalty_accounts')
      .header('Cookie', sessionCookie(login))

    response.assertStatus(200)

    const body = response.body() as {
      loyaltyAccounts: Array<{
        company: { name: string }
        locations: unknown[]
        program: { stampCount: number }
      }>
    }
    assert.lengthOf(body.loyaltyAccounts, 4)
    assert.deepEqual(
      body.loyaltyAccounts.map((account) => account.company.name),
      ['Company 1', 'Company 2', 'Company 3', 'Company 4']
    )
    assert.deepEqual(
      body.loyaltyAccounts.map((account) => account.locations.length),
      [1, 1, 1, 0]
    )
    assert.equal(body.loyaltyAccounts[3].program.stampCount, 1)
  })
})
