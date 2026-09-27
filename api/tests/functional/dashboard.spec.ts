import EarnedReward from '#models/earned_reward'
import { DateTime } from 'luxon'
import { rolePermissions } from '#authorization/roles'
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

async function createStamp(params: {
  email: string
  identifier: string
  program: LoyaltyProgram
  venue: Venue
  withReward?: boolean
}) {
  const customer = await User.create({
    email: params.email,
    encryptedPassword: 'password123',
  })
  const account = await LoyaltyAccount.create({
    userId: customer.id,
    loyaltyProgramId: params.program.id,
  })
  const tag = await NfcTag.create({
    venueId: params.venue.id,
    identifier: params.identifier,
  })
  const reward = params.withReward
    ? await EarnedReward.create({
        loyaltyAccountId: account.id,
        rewardTitleSnapshot: params.program.rewardTitle,
        stampsRequiredSnapshot: params.program.stampsRequired,
        earnedAt: DateTime.now(),
      })
    : null
  await Stamp.create({
    loyaltyAccountId: account.id,
    nfcTagId: tag.id,
    nfcCounter: 1,
    earnedRewardId: reward?.id ?? null,
  })
}

test.group('Business dashboard', () => {
  test('returns the whole company scope and permissions for a company owner', async ({
    client,
    assert,
  }) => {
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
    const [mainVenue] = await Venue.createMany([
      { companyId: company.id, name: 'Main venue', city: 'Kraków' },
      { companyId: company.id, name: 'Second venue', city: 'Warszawa' },
    ])
    await Membership.create({ userId: owner.id, companyId: company.id, role: 'company_owner' })
    await createStamp({
      email: 'owner-dashboard-customer@example.com',
      identifier: 'owner-dashboard-tag',
      program,
      venue: mainVenue,
    })

    const login = await signIn(client, owner.email, 'password123')
    const response = await client
      .get('/api/v1/business/dashboard')
      .header('Cookie', sessionCookie(login))

    response.assertStatus(200)
    const dashboard = response.body() as {
      view: string
      scope: { type: string; companyId: number }
      company: { access: unknown[] }
      program: { name: string; active: boolean } | null
      venues: Array<{ name: string; access: unknown[] }>
    }
    assert.equal(dashboard.view, 'company')
    assert.deepEqual(dashboard.scope, { type: 'company', companyId: Number(company.id) })
    assert.deepEqual(dashboard.company.access, [
      { role: 'company_owner', permissions: rolePermissions.company_owner },
    ])
    assert.deepInclude(dashboard.program, {
      name: 'Coffee Club',
      active: true,
    })
    assert.deepEqual(
      dashboard.venues.map((venue) => venue.name),
      ['Main venue', 'Second venue']
    )
    assert.deepEqual(dashboard.venues[1].access, [
      { role: 'company_owner', permissions: rolePermissions.company_owner },
    ])

    const statsResponse = await client
      .get('/api/v1/business/dashboard/stats')
      .header('Cookie', sessionCookie(login))

    statsResponse.assertStatus(200)
    statsResponse.assertBodyContains({
      view: 'company',
      scope: { type: 'company', companyId: Number(company.id) },
      stats: {
        customerCount: 1,
        stampCount: 1,
        earnedRewardCount: 0,
        activeTagCount: 1,
      },
      warnings: [],
    })
  })

  test('limits a venue manager to assigned venues and returns manager permissions', async ({
    client,
    assert,
  }) => {
    const manager = await User.create({
      email: 'manager-dashboard@example.com',
      encryptedPassword: 'password123',
    })
    const company = await Company.create({ name: 'Managed Coffee' })
    const program = await LoyaltyProgram.create({
      companyId: company.id,
      name: 'Managed Club',
      rewardTitle: 'Free cake',
      stampsRequired: 8,
      active: true,
    })
    const [assignedVenue, hiddenVenue] = await Venue.createMany([
      { companyId: company.id, name: 'Assigned venue' },
      { companyId: company.id, name: 'Hidden venue' },
    ])
    await Membership.create({
      userId: manager.id,
      venueId: assignedVenue.id,
      role: 'venue_manager',
    })
    await Promise.all([
      createStamp({
        email: 'manager-visible-customer@example.com',
        identifier: 'manager-visible-tag',
        program,
        venue: assignedVenue,
      }),
      createStamp({
        email: 'manager-hidden-customer@example.com',
        identifier: 'manager-hidden-tag',
        program,
        venue: hiddenVenue,
      }),
    ])

    const login = await signIn(client, manager.email, 'password123')
    const response = await client
      .get('/api/v1/business/dashboard')
      .header('Cookie', sessionCookie(login))

    response.assertStatus(200)
    const dashboard = response.body() as {
      view: string
      scope: { type: string; companyId: number; venueIds: number[] }
      company: { access: unknown[] }
      venues: Array<{ name: string; access: unknown[] }>
    }
    assert.equal(dashboard.view, 'company')
    assert.deepEqual(dashboard.scope, {
      type: 'venue',
      companyId: Number(company.id),
      venueIds: [Number(assignedVenue.id)],
    })
    assert.deepEqual(dashboard.company.access, [])
    assert.deepEqual(
      dashboard.venues.map((venue) => venue.name),
      ['Assigned venue']
    )
    assert.deepEqual(dashboard.venues[0].access, [
      { role: 'venue_manager', permissions: rolePermissions.venue_manager },
    ])

    const statsResponse = await client
      .get('/api/v1/business/dashboard/stats')
      .header('Cookie', sessionCookie(login))

    statsResponse.assertStatus(200)
    statsResponse.assertBodyContains({
      stats: { customerCount: 1, stampCount: 1, activeTagCount: 1 },
    })
  })

  test('returns only staff permissions and hides an inactive program from venue staff', async ({
    client,
    assert,
  }) => {
    const staff = await User.create({
      email: 'staff-dashboard@example.com',
      encryptedPassword: 'password123',
    })
    const company = await Company.create({ name: 'Staff Coffee' })
    await LoyaltyProgram.create({
      companyId: company.id,
      name: 'Inactive Club',
      rewardTitle: 'Old reward',
      stampsRequired: 5,
      active: false,
    })
    const venue = await Venue.create({ companyId: company.id, name: 'Staff venue' })
    await Membership.create({ userId: staff.id, venueId: venue.id, role: 'venue_staff' })

    const login = await signIn(client, staff.email, 'password123')
    const response = await client
      .get('/api/v1/business/dashboard')
      .header('Cookie', sessionCookie(login))

    response.assertStatus(200)
    const dashboard = response.body() as {
      program: unknown
      venues: Array<{ access: unknown[] }>
    }
    assert.equal(dashboard.program, null)
    assert.deepEqual(dashboard.venues[0].access, [
      { role: 'venue_staff', permissions: rolePermissions.venue_staff },
    ])
  })

  test('returns company selection instead of aggregating several companies', async ({
    client,
    assert,
  }) => {
    const admin = await User.create({
      email: 'admin-dashboard@example.com',
      encryptedPassword: 'password123',
    })
    const [firstCompany, secondCompany] = await Company.createMany([
      { name: 'Admin Company A' },
      { name: 'Admin Company B' },
      { name: 'Admin Company Without Venue' },
    ])
    await Venue.createMany([
      { companyId: firstCompany.id, name: 'Admin venue A' },
      { companyId: secondCompany.id, name: 'Admin venue B' },
    ])
    await Membership.create({ userId: admin.id, role: 'admin' })

    const login = await signIn(client, admin.email, 'password123')
    const response = await client
      .get('/api/v1/business/dashboard')
      .header('Cookie', sessionCookie(login))

    response.assertStatus(200)
    const dashboard = response.body() as {
      view: string
      companies: Array<{ name: string }>
    }
    assert.equal(dashboard.view, 'company_selection')
    assert.deepEqual(
      dashboard.companies.map((company) => company.name),
      ['Admin Company A', 'Admin Company B', 'Admin Company Without Venue']
    )

    const statsResponse = await client
      .get('/api/v1/business/dashboard/stats')
      .header('Cookie', sessionCookie(login))

    statsResponse.assertStatus(409)
    assert.deepEqual(statsResponse.body(), {
      code: 'COMPANY_SELECTION_REQUIRED',
      error: 'Select a company before loading dashboard statistics.',
    })
  })

  test('requires an owner with several companies to select one before loading stats', async ({
    client,
    assert,
  }) => {
    const owner = await User.create({
      email: 'multi-company-owner-dashboard@example.com',
      encryptedPassword: 'password123',
    })
    const [firstCompany, secondCompany] = await Company.createMany([
      { name: 'Owner Company A' },
      { name: 'Owner Company B' },
    ])
    await Membership.createMany([
      { userId: owner.id, companyId: firstCompany.id, role: 'company_owner' },
      { userId: owner.id, companyId: secondCompany.id, role: 'company_owner' },
    ])

    const login = await signIn(client, owner.email, 'password123')
    const cookie = sessionCookie(login)
    const dashboardResponse = await client
      .get('/api/v1/business/dashboard')
      .header('Cookie', cookie)

    dashboardResponse.assertStatus(200)
    assert.deepEqual(dashboardResponse.body(), {
      view: 'company_selection',
      companies: [
        { id: Number(firstCompany.id), name: 'Owner Company A' },
        { id: Number(secondCompany.id), name: 'Owner Company B' },
      ],
    })

    const statsResponse = await client
      .get('/api/v1/business/dashboard/stats')
      .header('Cookie', cookie)

    statsResponse.assertStatus(409)
    assert.deepEqual(statsResponse.body(), {
      code: 'COMPANY_SELECTION_REQUIRED',
      error: 'Select a company before loading dashboard statistics.',
    })
  })

  test('forbids a customer from both business dashboard endpoints', async ({ client, assert }) => {
    const user = await User.create({
      email: 'customer-dashboard@example.com',
      encryptedPassword: 'password123',
    })
    const login = await signIn(client, user.email, 'password123')
    const cookie = sessionCookie(login)

    const [dashboardResponse, statsResponse] = await Promise.all([
      client.get('/api/v1/business/dashboard').header('Cookie', cookie),
      client.get('/api/v1/business/dashboard/stats').header('Cookie', cookie),
    ])

    dashboardResponse.assertStatus(403)
    statsResponse.assertStatus(403)
    assert.deepEqual(dashboardResponse.body(), {
      error: 'You do not have access to a business dashboard.',
    })
    assert.deepEqual(statsResponse.body(), dashboardResponse.body())
  })
})

for (const role of ['admin', 'company_owner', 'venue_manager', 'venue_staff'] as const) {
  test(`filters both dashboards by company and venue for ${role}`, async ({ client, assert }) => {
    const user = await User.create({
      email: `${role}-filtered@example.com`,
      encryptedPassword: 'password123',
    })
    const companies = await Company.createMany([{ name: 'Selected' }, { name: 'Other' }])
    const venues = await Venue.createMany([
      { companyId: companies[0].id, name: 'First' },
      { companyId: companies[0].id, name: 'Second' },
      { companyId: companies[1].id, name: 'Other' },
    ])
    if (role === 'admin') {
      await Membership.create({ userId: user.id, role })
    } else if (role === 'company_owner') {
      await Membership.createMany(
        companies.map((company) => ({ userId: user.id, companyId: company.id, role }))
      )
    } else {
      await Membership.createMany(
        venues.map((venue) => ({ userId: user.id, venueId: venue.id, role }))
      )
    }
    for (const [index, company] of companies.entries()) {
      const program = await LoyaltyProgram.create({
        companyId: company.id,
        name: 'Club',
        rewardTitle: 'Coffee',
        stampsRequired: 5,
        active: true,
      })
      for (const venue of venues.filter((item) => String(item.companyId) === String(company.id))) {
        await createStamp({
          email: `${role}-${index}-${venue.id}@example.com`,
          identifier: `${role}-${venue.id}`,
          withReward: true,
          program,
          venue,
        })
      }
    }
    const cookie = sessionCookie(await signIn(client, user.email, 'password123'))
    for (const [filters, expectedVenues] of [
      [{ companyId: Number(companies[0].id) }, venues.slice(0, 2)],
      [{ venueId: Number(venues[0].id) }, [venues[0]]],
      [{ companyId: Number(companies[0].id), venueId: Number(venues[0].id) }, [venues[0]]],
    ] as const) {
      const response = await client
        .get('/api/v1/business/dashboard')
        .qs(filters)
        .header('Cookie', cookie)
      response.assertStatus(200)
      assert.deepEqual(
        (response.body() as { venues: Array<{ id: number }> }).venues.map((venue) => venue.id),
        expectedVenues.map((venue) => Number(venue.id))
      )
      const stats = await client
        .get('/api/v1/business/dashboard/stats')
        .qs(filters)
        .header('Cookie', cookie)
      stats.assertStatus(200)
      assert.deepEqual(stats.body().scope, response.body().scope)
      stats.assertBodyContains({
        stats: {
          customerCount: expectedVenues.length,
          stampCount: expectedVenues.length,
          activeTagCount: expectedVenues.length,
          earnedRewardCount: expectedVenues.length,
        },
        warnings: [],
      })
      assert.equal(
        stats
          .body()
          .series.stamps!.reduce(
            (total: number, point: { count: number }) => total + point.count,
            0
          ),
        expectedVenues.length
      )
      if ('venueId' in filters) {
        assert.deepEqual(stats.body().scope, {
          type: 'venue',
          companyId: Number(companies[0].id),
          venueIds: [Number(venues[0].id)],
        })
      }
    }
  })
}

for (const role of ['company_owner', 'venue_manager', 'venue_staff'] as const) {
  test(`never broadens dashboard access beyond the ${role} scope`, async ({ client, assert }) => {
    const user = await User.create({
      email: `${role}-scope-boundary@example.com`,
      encryptedPassword: 'password123',
    })
    const [allowedCompany, foreignCompany] = await Company.createMany([
      { name: `${role} allowed company` },
      { name: `${role} foreign company` },
    ])
    const [assignedVenue, siblingVenue, foreignVenue] = await Venue.createMany([
      { companyId: allowedCompany.id, name: 'Assigned venue' },
      { companyId: allowedCompany.id, name: 'Sibling venue' },
      { companyId: foreignCompany.id, name: 'Foreign venue' },
    ])
    const [allowedProgram, foreignProgram] = await LoyaltyProgram.createMany([
      {
        companyId: allowedCompany.id,
        name: 'Allowed club',
        rewardTitle: 'Allowed reward',
        stampsRequired: 5,
        active: true,
      },
      {
        companyId: foreignCompany.id,
        name: 'Foreign club',
        rewardTitle: 'Foreign reward',
        stampsRequired: 5,
        active: true,
      },
    ])

    await Membership.create(
      role === 'company_owner'
        ? { userId: user.id, companyId: allowedCompany.id, role }
        : { userId: user.id, venueId: assignedVenue.id, role }
    )
    await Promise.all([
      createStamp({
        email: `${role}-assigned-customer@example.com`,
        identifier: `${role}-assigned-tag`,
        program: allowedProgram,
        venue: assignedVenue,
        withReward: true,
      }),
      createStamp({
        email: `${role}-sibling-customer@example.com`,
        identifier: `${role}-sibling-tag`,
        program: allowedProgram,
        venue: siblingVenue,
        withReward: true,
      }),
      createStamp({
        email: `${role}-foreign-customer@example.com`,
        identifier: `${role}-foreign-tag`,
        program: foreignProgram,
        venue: foreignVenue,
        withReward: true,
      }),
    ])

    const cookie = sessionCookie(await signIn(client, user.email, 'password123'))
    const expectedVenues =
      role === 'company_owner' ? [assignedVenue, siblingVenue] : [assignedVenue]
    const expectedCount = expectedVenues.length

    const dashboard = await client
      .get('/api/v1/business/dashboard')
      .qs({ companyId: Number(allowedCompany.id) })
      .header('Cookie', cookie)
    dashboard.assertStatus(200)
    const dashboardBody = dashboard.body() as { venues: Array<{ id: number }> }
    assert.deepEqual(
      dashboardBody.venues.map((venue) => venue.id),
      expectedVenues.map((venue) => Number(venue.id))
    )

    const stats = await client
      .get('/api/v1/business/dashboard/stats')
      .qs({ companyId: Number(allowedCompany.id) })
      .header('Cookie', cookie)
    stats.assertStatus(200)
    stats.assertBodyContains({
      stats: {
        customerCount: expectedCount,
        stampCount: expectedCount,
        earnedRewardCount: expectedCount,
        activeTagCount: expectedCount,
      },
      warnings: [],
    })
    assert.equal(
      stats
        .body()
        .series.stamps!.reduce((total: number, point: { count: number }) => total + point.count, 0),
      expectedCount
    )

    const forbiddenSelections = [
      { companyId: Number(foreignCompany.id) },
      { venueId: Number(foreignVenue.id) },
      { companyId: Number(allowedCompany.id), venueId: Number(foreignVenue.id) },
      ...(role === 'company_owner' ? [] : [{ venueId: Number(siblingVenue.id) }]),
    ]

    for (const endpoint of [
      '/api/v1/business/dashboard',
      '/api/v1/business/dashboard/stats',
    ] as const) {
      for (const filters of forbiddenSelections) {
        const response = await client.get(endpoint).qs(filters).header('Cookie', cookie)
        response.assertStatus(403)
      }
    }
  })
}

test('rejects inaccessible and mismatched selections on both endpoints', async ({ client }) => {
  const user = await User.create({
    email: 'restricted-selection@example.com',
    encryptedPassword: 'password123',
  })
  const [company, otherCompany] = await Company.createMany([
    { name: 'Accessible' },
    { name: 'Foreign' },
  ])
  const [assigned, hidden, other] = await Venue.createMany([
    { companyId: company.id, name: 'Assigned' },
    { companyId: company.id, name: 'Hidden' },
    { companyId: otherCompany.id, name: 'Other' },
  ])
  await Membership.create({ userId: user.id, venueId: assigned.id, role: 'venue_staff' })
  const cookie = sessionCookie(await signIn(client, user.email, 'password123'))
  for (const endpoint of [
    '/api/v1/business/dashboard',
    '/api/v1/business/dashboard/stats',
  ] as const) {
    for (const filters of [
      { companyId: Number(otherCompany.id) },
      { venueId: Number(hidden.id) },
      { venueId: Number(other.id) },
      { venueId: 999999999 },
      { companyId: 999999999 },
    ]) {
      const response = await client.get(endpoint).qs(filters).header('Cookie', cookie)
      response.assertStatus(403)
    }
    // Both resources are accessible now; their relationship must still be checked.
    await Membership.firstOrCreate({ userId: user.id, venueId: other.id }, { role: 'venue_staff' })
    const mismatch = await client
      .get(endpoint)
      .qs({ companyId: Number(company.id), venueId: Number(other.id) })
      .header('Cookie', cookie)
    mismatch.assertStatus(403)
    await Membership.query()
      .where('user_id', String(user.id))
      .where('venue_id', String(other.id))
      .delete()
    const allowed = await client
      .get(endpoint)
      .qs({ companyId: Number(company.id) })
      .header('Cookie', cookie)
    allowed.assertStatus(200)
    allowed.assertBodyContains({
      scope: { type: 'venue', companyId: Number(company.id), venueIds: [Number(assigned.id)] },
    })
  }
})

test('validates dashboard filters and requires authentication', async ({ client }) => {
  const user = await User.create({
    email: 'validation-selection@example.com',
    encryptedPassword: 'password123',
  })
  await Membership.create({ userId: user.id, role: 'admin' })
  const cookie = sessionCookie(await signIn(client, user.email, 'password123'))
  for (const endpoint of [
    '/api/v1/business/dashboard',
    '/api/v1/business/dashboard/stats',
  ] as const) {
    const anonymous = await client.get(endpoint).qs({ venueId: 1 })
    anonymous.assertStatus(401)
    for (const field of ['companyId', 'venueId']) {
      for (const value of ['abc', '0', '-1', '1.5', '9007199254740992']) {
        const response = await client
          .get(endpoint)
          .qs({ [field]: value })
          .header('Cookie', cookie)
          .header('Accept', 'application/json')
        response.assertStatus(422)
      }
    }
  }
})

test('keeps company ownership separate from staff access in another company', async ({
  client,
  assert,
}) => {
  const user = await User.create({
    email: 'mixed-dashboard-access@example.com',
    encryptedPassword: 'password123',
  })
  const [ownedCompany, staffedCompany] = await Company.createMany([
    { name: 'Owned company without venues' },
    { name: 'Staffed company' },
  ])
  const [assignedVenue, hiddenVenue] = await Venue.createMany([
    { companyId: staffedCompany.id, name: 'Assigned venue' },
    { companyId: staffedCompany.id, name: 'Hidden venue' },
  ])
  const program = await LoyaltyProgram.create({
    companyId: staffedCompany.id,
    name: 'Staffed company club',
    rewardTitle: 'Coffee',
    stampsRequired: 5,
    active: true,
  })
  await Membership.createMany([
    { userId: user.id, companyId: ownedCompany.id, role: 'company_owner' },
    { userId: user.id, venueId: assignedVenue.id, role: 'venue_staff' },
  ])
  await Promise.all([
    createStamp({
      email: 'mixed-assigned-customer@example.com',
      identifier: 'mixed-assigned-tag',
      program,
      venue: assignedVenue,
      withReward: true,
    }),
    createStamp({
      email: 'mixed-hidden-customer@example.com',
      identifier: 'mixed-hidden-tag',
      program,
      venue: hiddenVenue,
      withReward: true,
    }),
  ])
  const cookie = sessionCookie(await signIn(client, user.email, 'password123'))
  const selection = await client.get('/api/v1/business/dashboard').header('Cookie', cookie)
  selection.assertStatus(200)
  selection.assertBodyContains({
    view: 'company_selection',
    companies: [
      { id: Number(ownedCompany.id), name: ownedCompany.name },
      { id: Number(staffedCompany.id), name: staffedCompany.name },
    ],
  })

  for (const endpoint of [
    '/api/v1/business/dashboard',
    '/api/v1/business/dashboard/stats',
  ] as const) {
    const owned = await client
      .get(endpoint)
      .qs({ companyId: Number(ownedCompany.id) })
      .header('Cookie', cookie)
    owned.assertStatus(200)
    owned.assertBodyContains({ scope: { type: 'company', companyId: Number(ownedCompany.id) } })

    const staffed = await client
      .get(endpoint)
      .qs({ companyId: Number(staffedCompany.id) })
      .header('Cookie', cookie)
    staffed.assertStatus(200)
    staffed.assertBodyContains({
      scope: {
        type: 'venue',
        companyId: Number(staffedCompany.id),
        venueIds: [Number(assignedVenue.id)],
      },
    })
    if (endpoint.endsWith('/stats')) {
      staffed.assertBodyContains({
        stats: {
          customerCount: 1,
          stampCount: 1,
          earnedRewardCount: 1,
          activeTagCount: 1,
        },
      })
    } else {
      const staffedDashboard = staffed.body() as {
        company: { access: unknown[] }
        venues: Array<{ id: number; access: unknown[] }>
      }
      assert.deepEqual(staffedDashboard.company.access, [])
      assert.deepEqual(
        staffedDashboard.venues.map((venue) => ({
          id: venue.id,
          access: venue.access,
        })),
        [
          {
            id: Number(assignedVenue.id),
            access: [{ role: 'venue_staff', permissions: rolePermissions.venue_staff }],
          },
        ]
      )
    }

    const hidden = await client
      .get(endpoint)
      .qs({ venueId: Number(hiddenVenue.id) })
      .header('Cookie', cookie)
    hidden.assertStatus(403)
  }
})

test('allows a platform admin to select a company without venues', async ({ client, assert }) => {
  const user = await User.create({
    email: 'platform-empty-company@example.com',
    encryptedPassword: 'password123',
  })
  const company = await Company.create({ name: 'Empty company' })
  await Membership.create({ userId: user.id, role: 'admin' })

  const cookie = sessionCookie(await signIn(client, user.email, 'password123'))
  const response = await client
    .get('/api/v1/business/dashboard')
    .qs({ companyId: Number(company.id) })
    .header('Cookie', cookie)

  response.assertStatus(200)
  assert.deepEqual(response.body(), {
    view: 'company',
    scope: { type: 'company', companyId: Number(company.id) },
    company: {
      id: Number(company.id),
      name: company.name,
      access: [{ role: 'admin', permissions: rolePermissions.admin }],
    },
    program: null,
    venues: [],
  })
})
