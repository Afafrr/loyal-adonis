import User from '#models/user'
import VerifyTagService from '#services/nfc/verify_tag_service'
import { sessionCookie, signIn } from '#tests/helpers/http'
import { test } from '@japa/runner'

test.group('Tag scan', () => {
  test('requires authentication', async ({ client }) => {
    const response = await client.get('/api/v1/tag_scan').qs({
      picc_data: '8314399577DCFFE9798B4C4714FB89EE',
      enc: 'D0E3028A46AFCBA11B9DB95E36C55762',
      cmac: '6F586B688126B57C',
    })

    response.assertStatus(401)
  })

  test('requires all encrypted SDM parameters', async ({ client }) => {
    const user = await User.create({
      email: 'user@example.com',
      encryptedPassword: 'password123',
    })
    const login = await signIn(client, user.email, 'password123')

    const response = await client
      .get('/api/v1/tag_scan')
      .header('Cookie', sessionCookie(login))
      .qs({
        picc_data: '8314399577DCFFE9798B4C4714FB89EE',
        cmac: '6F586B688126B57C',
      })

    response.assertStatus(400)
  })

  test('passes through the NFC service status and raw body', async ({ client, assert }) => {
    const user = await User.create({
      email: 'user@example.com',
      encryptedPassword: 'password123',
    })
    const login = await signIn(client, user.email, 'password123')
    const originalCall = VerifyTagService.prototype.call
    VerifyTagService.prototype.call = async () => ({ status: 202, body: '{"valid":true}' })

    try {
      const response = await client
        .get('/api/v1/tag_scan')
        .header('Cookie', sessionCookie(login))
        .qs({
          picc_data: '8314399577DCFFE9798B4C4714FB89EE',
          enc: 'D0E3028A46AFCBA11B9DB95E36C55762',
          cmac: '6F586B688126B57C',
        })

      response.assertStatus(202)
      assert.equal(response.text(), '{"valid":true}')
      assert.include(response.header('content-type'), 'text/plain')
    } finally {
      VerifyTagService.prototype.call = originalCall
    }
  })
})
