import { mock } from 'node:test'
import { DateTime, Settings } from 'luxon'
import { test } from '@japa/runner'
import Company from '#models/company'
import LoyaltyAccount from '#models/loyalty_account'
import LoyaltyProgram from '#models/loyalty_program'
import Membership from '#models/membership'
import NfcTag from '#models/nfc_tag'
import Stamp from '#models/stamp'
import User from '#models/user'
import Venue from '#models/venue'
import { sessionCookie, signIn } from '#tests/helpers/http'

const endpoint = '/api/v1/business/dashboard/stats' as const
const today = DateTime.fromISO('2024-03-01T00:00:00Z', { zone: 'utc' })
type Point = { date: string; count: number }

async function createOwner() {
  const owner = await User.create({
    email: 'stamp-series-owner@example.com',
    encryptedPassword: 'password123',
  })
  const company = await Company.create({ name: 'Stamp series company' })
  await Membership.create({ userId: owner.id, companyId: company.id, role: 'company_owner' })
  return { owner, company }
}

async function createStampSource(owner: User, company: Company) {
  const venue = await Venue.create({ companyId: company.id, name: 'Stamp series venue' })
  const program = await LoyaltyProgram.create({
    companyId: company.id,
    name: 'Coffee club',
    rewardTitle: 'Coffee',
    stampsRequired: 10,
    active: true,
  })
  const account = await LoyaltyAccount.create({ userId: owner.id, loyaltyProgramId: program.id })
  const tag = await NfcTag.create({ venueId: venue.id, identifier: 'stamp-series-tag' })
  return { account, tag }
}

test.group('Dashboard stamp series', (group) => {
  group.each.setup(() => {
    const originalNow = Settings.now
    Settings.now = () => today.plus({ hours: 12 }).toMillis()
    return () => {
      Settings.now = originalNow
    }
  })

  for (const [range, days] of [
    ['7d', 7],
    ['30d', 30],
    ['90d', 90],
  ] as const) {
    test(`returns ${range} in UTC with exact boundaries and zero-filled days`, async ({
      client,
      assert,
    }) => {
      const { owner, company } = await createOwner()
      const { account, tag } = await createStampSource(owner, company)
      const start = today.minus({ days: days - 1 })
      const end = today.plus({ days: 1 })
      const dates = [
        start.minus({ milliseconds: 1 }),
        start,
        start.plus({ hours: 1 }),
        today.minus({ milliseconds: 1 }),
        today,
        end.minus({ milliseconds: 1 }),
        end,
      ]
      await Stamp.createMany(
        dates.map((createdAt, index) => ({
          loyaltyAccountId: account.id,
          nfcTagId: tag.id,
          nfcCounter: index + 1,
          createdAt,
        }))
      )
      // A historical stamp still counts after its tag has been deactivated.
      tag.active = false
      await tag.save()
      const cookie = sessionCookie(await signIn(client, owner.email, 'password123'))
      const response = await client.get(endpoint).qs({ range }).header('Cookie', cookie)
      response.assertStatus(200)
      assert.deepEqual(response.body().period, {
        range,
        from: start.toISODate(),
        to: '2024-03-01',
        timezone: 'UTC',
        interval: 'day',
      })
      const expected = Array.from({ length: days }, (_, index) => ({
        date: start.plus({ days: index }).toISODate(),
        count: index === 0 || index === days - 1 ? 2 : index === days - 2 ? 1 : 0,
      }))
      assert.deepEqual(response.body().series.stamps, expected)
      assert.equal(response.body().stats.stampCount, 7)
      assert.equal(response.body().stats.activeTagCount, 0)
      assert.deepEqual(response.body().warnings, [])
    })
  }

  test('defaults to 30 days and returns zeros for a venue without stamps', async ({
    client,
    assert,
  }) => {
    const { owner, company } = await createOwner()
    await createStampSource(owner, company)
    const cookie = sessionCookie(await signIn(client, owner.email, 'password123'))
    const response = await client.get(endpoint).header('Cookie', cookie)
    response.assertStatus(200)
    assert.deepEqual(response.body().period, {
      range: '30d',
      from: '2024-02-01',
      to: '2024-03-01',
      timezone: 'UTC',
      interval: 'day',
    })
    const points = response.body().series.stamps as Point[]
    assert.lengthOf(points, 30)
    assert.isTrue(points.every((point) => point.count === 0))
    assert.deepEqual(response.body().warnings, [])
  })

  test('returns an empty dashboard with a complete series for an admin without companies', async ({
    client,
    assert,
  }) => {
    const admin = await User.create({
      email: 'empty-series-admin@example.com',
      encryptedPassword: 'password123',
    })
    await Membership.create({ userId: admin.id, role: 'admin' })
    const cookie = sessionCookie(await signIn(client, admin.email, 'password123'))
    const response = await client.get(endpoint).qs({ range: '7d' }).header('Cookie', cookie)
    response.assertStatus(200)
    assert.equal(response.body().view, 'empty')
    const points = response.body().series.stamps as Point[]
    assert.lengthOf(points, 7)
    assert.isTrue(points.every((point) => point.count === 0))
  })

  test('rejects unsupported and structured ranges and requires authentication', async ({
    client,
  }) => {
    const { owner } = await createOwner()
    const anonymous = await client.get(endpoint).qs({ range: '7d' })
    anonymous.assertStatus(401)
    const cookie = sessionCookie(await signIn(client, owner.email, 'password123'))
    for (const range of ['1d', '365d', '30', '30D', '', ['7d', '30d'], { days: 7 }]) {
      const response = await client
        .get(endpoint)
        // @ts-expect-error Deliberately send invalid values to exercise HTTP validation.
        .qs({ range })
        .header('Cookie', cookie)
        .header('Accept', 'application/json')
      response.assertStatus(422)
    }
  })

  test('reports a failed series as unavailable while preserving lifetime statistics', async ({
    client,
    assert,
  }) => {
    const { owner, company } = await createOwner()
    const { account, tag } = await createStampSource(owner, company)
    await Stamp.create({ loyaltyAccountId: account.id, nfcTagId: tag.id, nfcCounter: 1 })
    const cookie = sessionCookie(await signIn(client, owner.email, 'password123'))
    const queryMock = mock.method(Stamp, 'query', () => {
      throw new Error('Simulated series query failure')
    })
    try {
      const response = await client.get(endpoint).header('Cookie', cookie)
      response.assertStatus(200)
      assert.equal(response.body().stats.stampCount, 1)
      assert.isNull(response.body().series.stamps)
      assert.deepEqual(response.body().warnings, [
        { field: 'series.stamps', message: 'Unable to load stamp activity.' },
      ])
    } finally {
      queryMock.mock.restore()
    }
  })
})
