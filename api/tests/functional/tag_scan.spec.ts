import Company from '#models/company'
import LoyaltyAccount from '#models/loyalty_account'
import LoyaltyProgram from '#models/loyalty_program'
import NfcTag from '#models/nfc_tag'
import Stamp from '#models/stamp'
import User from '#models/user'
import Venue from '#models/venue'
import { getCsrf, sessionCookie, signIn } from '#tests/helpers/http'
import { test } from '@japa/runner'

const scanPayload = {
  picc_data: '8314399577DCFFE9798B4C4714FB89EE',
  enc: 'D0E3028A46AFCBA11B9DB95E36C55762',
  cmac: '6F586B688126B57C',
}

async function createLoyaltyTag(identifier = '041C6432A91190') {
  const company = await Company.create({ name: 'Coffee Co.' })
  const venue = await Venue.create({ companyId: company.id, name: 'Main Street' })
  await LoyaltyProgram.create({
    companyId: company.id,
    name: 'Coffee stamps',
    rewardTitle: 'Free coffee',
    stampsRequired: 10,
    active: true,
  })
  return NfcTag.create({ venueId: venue.id, identifier, active: true, lastAcceptedCounter: 0 })
}

async function authenticatedPost(
  client: Parameters<typeof signIn>[0],
  user: User,
  payload = scanPayload
) {
  const login = await signIn(client, user.email, 'password123')
  const csrf = await getCsrf(client, sessionCookie(login))

  return client
    .post('/api/v1/tag_scans')
    .header('Cookie', csrf.cookie)
    .header('X-XSRF-TOKEN', csrf.token)
    .json(payload)
}

test.group('Tag scans', () => {
  test('requires authentication', async ({ client }) => {
    const csrf = await getCsrf(client)
    const response = await client
      .post('/api/v1/tag_scans')
      .header('Cookie', csrf.cookie)
      .header('X-XSRF-TOKEN', csrf.token)
      .json(scanPayload)

    response.assertStatus(401)
  })

  test('validates encrypted SDM parameters', async ({ client }) => {
    const user = await User.create({ email: 'user@example.com', encryptedPassword: 'password123' })

    const response = await authenticatedPost(client, user, { ...scanPayload, enc: '' })

    response.assertStatus(422)
  })

  test('creates a loyalty account on the first valid scan and records a stamp', async ({
    client,
    assert,
  }) => {
    const user = await User.create({ email: 'user@example.com', encryptedPassword: 'password123' })
    const tag = await createLoyaltyTag()
    const originalFetch = globalThis.fetch
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ uid: tag.identifier, read_ctr: 13 }), { status: 200 })

    try {
      const response = await authenticatedPost(client, user)

      response.assertStatus(201)
      response.assertBodyContains({ venueId: Number(tag.venueId) })

      const loyaltyAccount = await LoyaltyAccount.findByOrFail({ userId: user.id })
      const stamp = await Stamp.findByOrFail({
        loyaltyAccountId: loyaltyAccount.id,
        nfcTagId: tag.id,
      })
      assert.equal(Number(stamp.nfcCounter), 13)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  test('rejects a repeated NFC counter without adding a second stamp', async ({
    client,
    assert,
  }) => {
    const user = await User.create({ email: 'user@example.com', encryptedPassword: 'password123' })
    const tag = await createLoyaltyTag()
    const originalFetch = globalThis.fetch
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ uid: tag.identifier, read_ctr: 13 }), { status: 200 })

    try {
      const firstResponse = await authenticatedPost(client, user)
      firstResponse.assertStatus(201)

      const repeatResponse = await authenticatedPost(client, user)
      repeatResponse.assertStatus(409)
      assert.deepEqual(repeatResponse.body(), { error: 'This NFC scan has already been accepted.' })

      const stampCount = await Stamp.query().where('nfc_tag_id', Number(tag.id)).count('* as total')
      assert.equal(Number(stampCount[0].$extras.total), 1)
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
