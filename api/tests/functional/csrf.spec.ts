import { test } from '@japa/runner'

test.group('CSRF', () => {
  test('sets CSRF values for HTTP clients', async ({ client }) => {
    const response = await client.get('/up')

    response.assertStatus(200)
    response.assertCookie('_loyal_session')
    response.assertCookie('XSRF-TOKEN')
    response.assertHeader('X-CSRF-Token')
  })

  test('rejects a state-changing request without a token', async ({ client }) => {
    const response = await client.post('/api/v1/users/sign_in').json({
      user: { email: 'user@example.com', password: 'password123' },
    })

    response.assertStatus(403)
    response.assertBody({ error: 'Invalid CSRF token' })
  })
})
