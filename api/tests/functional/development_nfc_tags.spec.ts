import User from '#models/user'
import { getCsrf, sessionCookie, signIn } from '#tests/helpers/http'
import { test } from '@japa/runner'

const payload = {
  picc_data: '8314399577DCFFE9798B4C4714FB89EE',
  enc: 'D0E3028A46AFCBA11B9DB95E36C55762',
  cmac: '6F586B688126B57C',
}

test.group('Development NFC tag inspection', () => {
  test('requires authentication', async ({ client }) => {
    const csrf = await getCsrf(client)
    const response = await client
      .post('/api/v1/dev/nfc_tags/inspect')
      .header('Cookie', csrf.cookie)
      .header('X-XSRF-TOKEN', csrf.token)
      .json(payload)

    response.assertStatus(401)
  })

  test('returns the verified tag identifier without persisting a tag', async ({ client }) => {
    const user = await User.create({ email: 'developer@example.com', encryptedPassword: 'password123' })
    const login = await signIn(client, user.email, 'password123')
    const csrf = await getCsrf(client, sessionCookie(login))
    const originalFetch = globalThis.fetch
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ uid: '041C6432A91190', read_ctr: 13 }), { status: 200 })

    try {
      const response = await client
        .post('/api/v1/dev/nfc_tags/inspect')
        .header('Cookie', csrf.cookie)
        .header('X-XSRF-TOKEN', csrf.token)
        .json(payload)

      response.assertStatus(200)
      response.assertBody({ tag: { identifier: '041C6432A91190', readCounter: 13 } })
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
