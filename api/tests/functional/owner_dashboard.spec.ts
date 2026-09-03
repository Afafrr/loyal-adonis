import Company from '#models/company'
import LoyaltyAccount from '#models/loyalty_account'
import LoyaltyProgram from '#models/loyalty_program'
import Membership from '#models/membership'
import NfcTag from '#models/nfc_tag'
import Stamp from '#models/stamp'
import User from '#models/user'
import Venue from '#models/venue'
import { sessionCookie, signIn } from '#tests/helpers/http'
import { test } from '@japa/runner'

test.group('Owner dashboard', () => {
  test('returns company summary and aggregated stats for a company owner', async ({ client }) => {
    const owner = await User.create({
      email: 'owner-dashboard@example.com',
      encryptedPassword: 'password123',
    })
    const company = await Company.create({ name: 'Dashboard Coffee' })
    const program = await LoyaltyProgram.create({
      companyId: company.id,
      name: 'Coffee Club',
      rewardTitle: 'Free coffee',
      stampsRequired: 10,
      active: true,
    })
    const venue = await Venue.create({ companyId: company.id, name: 'Main venue', city: 'Kraków' })
    await Membership.create({ userId: owner.id, companyId: company.id, role: 'company_owner' })

    const customer = await User.create({
      email: 'dashboard-customer@example.com',
      encryptedPassword: 'password123',
    })
    const account = await LoyaltyAccount.create({
      userId: customer.id,
      loyaltyProgramId: program.id,
    })
    const tag = await NfcTag.create({ venueId: venue.id, identifier: 'dashboard-tag' })
    await Stamp.create({
      loyaltyAccountId: account.id,
      nfcTagId: tag.id,
      nfcCounter: 1,
    })

    const login = await signIn(client, owner.email, 'password123')
    const response = await client
      .get('/api/v1/owner/dashboard')
      .header('Cookie', sessionCookie(login))

    response.assertStatus(200)
    response.assertBodyContains({
      company: { id: Number(company.id), name: 'Dashboard Coffee' },
      stats: {
        venueCount: 1,
        customerCount: 1,
        stampCount: 1,
        earnedRewardCount: 0,
        activeTagCount: 1,
      },
      venues: [{ id: Number(venue.id), name: 'Main venue', city: 'Kraków' }],
    })
  })

  test('forbids authenticated users without a company owner membership', async ({
    client,
    assert,
  }) => {
    const user = await User.create({
      email: 'not-owner-dashboard@example.com',
      encryptedPassword: 'password123',
    })
    const login = await signIn(client, user.email, 'password123')

    const response = await client
      .get('/api/v1/owner/dashboard')
      .header('Cookie', sessionCookie(login))

    response.assertStatus(403)
    assert.deepEqual(response.body(), { error: 'You do not have access to an owner dashboard.' })
  })
})
