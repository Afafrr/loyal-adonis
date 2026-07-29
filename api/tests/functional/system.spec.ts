import { test } from '@japa/runner'

test.group('System endpoints', () => {
  test('reports application health', async ({ client, assert }) => {
    const response = await client.get('/up')

    response.assertStatus(200)
    response.assertBodyContains({ status: 'up' })
    assert.isTrue(Number.isFinite(Date.parse(response.body().timestamp)))
  })

  test('returns the Rails-compatible unauthorized response', async ({ client }) => {
    const response = await client.get('/api/v1/me')

    response.assertStatus(401)
    response.assertBody({
      error: 'You need to sign in or sign up before continuing.',
    })
  })

  test('allows credentialed CORS requests from the configured frontend', async ({ client }) => {
    const response = await client
      .options('/api/v1/users')
      .header('Origin', 'http://localhost:3000')
      .header('Access-Control-Request-Method', 'POST')

    response.assertStatus(204)
    response.assertHeader('access-control-allow-origin', 'http://localhost:3000')
    response.assertHeader('access-control-allow-credentials', 'true')
  })
})
