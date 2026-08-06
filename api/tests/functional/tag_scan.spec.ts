import Company from '#models/company'
import EarnedReward from '#models/earned_reward'
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

async function createLoyaltyTag({
  identifier,
  stampsRequired,
}: { identifier?: string; stampsRequired?: number } = {}) {
  const tagIdentifier = identifier ?? '041C6432A91190'
  const company = await Company.create({ name: 'Coffee Co.' })
  const venue = await Venue.create({ companyId: company.id, name: 'Main Street' })
  await LoyaltyProgram.create({
    companyId: company.id,
    name: 'Coffee stamps',
    rewardTitle: 'Free coffee',
    stampsRequired: stampsRequired ?? 10,
    active: true,
  })
  return NfcTag.create({
    venueId: venue.id,
    identifier: tagIdentifier,
    active: true,
    lastAcceptedCounter: 0,
  })
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

  test('awards a reward at the threshold and starts the next stamp card', async ({
    client,
    assert,
  }) => {
    const user = await User.create({ email: 'user@example.com', encryptedPassword: 'password123' })
    const tag = await createLoyaltyTag({ stampsRequired: 2 })
    const originalFetch = globalThis.fetch
    let readCounter = 0
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ uid: tag.identifier, read_ctr: ++readCounter }), {
        status: 200,
      })

    try {
      const firstResponse = await authenticatedPost(client, user)
      firstResponse.assertStatus(201)
      firstResponse.assertBodyContains({
        earnedReward: null,
        progress: { collectedStamps: 1, stampsRequired: 2 },
      })

      const thresholdResponse = await authenticatedPost(client, user)
      thresholdResponse.assertStatus(201)
      thresholdResponse.assertBodyContains({
        earnedReward: { title: 'Free coffee' },
        progress: { collectedStamps: 0, stampsRequired: 2 },
      })

      const nextCardResponse = await authenticatedPost(client, user)
      nextCardResponse.assertStatus(201)
      nextCardResponse.assertBodyContains({
        earnedReward: null,
        progress: { collectedStamps: 1, stampsRequired: 2 },
      })

      const secondThresholdResponse = await authenticatedPost(client, user)
      secondThresholdResponse.assertStatus(201)
      secondThresholdResponse.assertBodyContains({
        earnedReward: { title: 'Free coffee' },
        progress: { collectedStamps: 0, stampsRequired: 2 },
      })

      const loyaltyAccount = await LoyaltyAccount.findByOrFail({ userId: user.id })
      const rewards = await EarnedReward.query()
        .where('loyalty_account_id', Number(loyaltyAccount.id))
        .orderBy('earned_at', 'asc')
      const allocatedStamps = await Stamp.query()
        .where('loyalty_account_id', Number(loyaltyAccount.id))
        .whereNotNull('earned_reward_id')

      assert.lengthOf(rewards, 2)
      assert.equal(rewards[0].stampsRequiredSnapshot, 2)
      assert.equal(rewards[0].rewardTitleSnapshot, 'Free coffee')
      assert.lengthOf(allocatedStamps, 4)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  test('serializes concurrent first scans for the same loyalty account', async ({
    client,
    assert,
  }) => {
    const user = await User.create({
      email: 'concurrent-user@example.com',
      encryptedPassword: 'password123',
    })
    const tag = await createLoyaltyTag({ stampsRequired: 1 })
    const originalFetch = globalThis.fetch
    let readCounter = 0
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ uid: tag.identifier, read_ctr: ++readCounter }), {
        status: 200,
      })

    try {
      const [firstResponse, secondResponse] = await Promise.all([
        authenticatedPost(client, user),
        authenticatedPost(client, user),
      ])

      firstResponse.assertStatus(201)
      secondResponse.assertStatus(201)

      const loyaltyAccounts = await LoyaltyAccount.query().where('user_id', Number(user.id))
      const loyaltyAccountId = Number(loyaltyAccounts[0].id)
      const stamps = await Stamp.query().where('loyalty_account_id', loyaltyAccountId)
      const rewards = await EarnedReward.query()
        .where('loyalty_account_id', loyaltyAccountId)
        .orderBy('earned_at', 'asc')

      assert.lengthOf(loyaltyAccounts, 1)
      assert.lengthOf(stamps, 2)
      assert.lengthOf(rewards, 2)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  test('rejects a repeated NFC counter without adding a second stamp', async ({
    client,
    assert,
  }) => {
    const user = await User.create({ email: 'user@example.com', encryptedPassword: 'password123' })
    const tag = await createLoyaltyTag({ stampsRequired: 1 })
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
      const rewardCount = await EarnedReward.query().count('* as total')
      assert.equal(Number(stampCount[0].$extras.total), 1)
      assert.equal(Number(rewardCount[0].$extras.total), 1)
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
