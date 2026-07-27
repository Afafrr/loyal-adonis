import { test } from '@japa/runner'

test.group('CSRF', () => {
  test('returns a token for state-changing requests', async ({ client, assert }) => {
    const response = await client.get('/api/v1/csrf')

    response.assertStatus(200)
    response.assertCookie('_loyal_session')
    assert.isString(response.body().csrf_token)
    assert.isNotEmpty(response.body().csrf_token)
  })

  test('rejects a state-changing request without a token', async ({ client }) => {
    const response = await client.post('/api/v1/users/sign_in').json({
      user: { email: 'user@example.com', password: 'password123' },
    })

    response.assertStatus(403)
    response.assertBody({ error: 'Invalid CSRF token' })
  })
})
