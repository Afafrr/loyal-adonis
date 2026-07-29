import User from '#models/user'
import { getCsrf, sessionCookie, signIn } from '#tests/helpers/http'
import { test } from '@japa/runner'

test.group('Authentication', () => {
  test('registers and signs in a new user', async ({ client, db }) => {
    const csrf = await getCsrf(client)
    const response = await client
      .post('/api/v1/users')
      .header('Cookie', csrf.cookie)
      .header('X-XSRF-TOKEN', csrf.token)
      .json({
        user: {
          email: ' NEW-USER@example.com ',
          password: 'password123',
          password_confirmation: 'password123',
        },
      })

    response.assertStatus(201)
    response.assertBodyContains({ email: 'new-user@example.com' })
    response.assertCookie('_loyal_session')
    await db.assertHas('users', { email: 'new-user@example.com' })
  })

  test('rejects invalid registration data', async ({ client, db }) => {
    const csrf = await getCsrf(client)
    const response = await client
      .post('/api/v1/users')
      .header('Cookie', csrf.cookie)
      .header('X-XSRF-TOKEN', csrf.token)
      .json({
        user: {
          email: 'invalid-email',
          password: 'short',
          password_confirmation: 'different',
        },
      })

    response.assertStatus(422)
    await db.assertEmpty('users')
  })

  test('logs in and exposes the current user', async ({ client }) => {
    const user = await User.create({
      email: 'user@example.com',
      encryptedPassword: 'password123',
    })

    const login = await signIn(client, user.email, 'password123')

    login.assertStatus(201)
    login.assertCookie('_loyal_session')

    const me = await client.get('/api/v1/me').header('Cookie', sessionCookie(login))
    me.assertStatus(200)
    me.assertBody({ id: Number(user.id), email: user.email })
  })

  test('rejects invalid credentials', async ({ client }) => {
    await User.create({
      email: 'user@example.com',
      encryptedPassword: 'password123',
    })

    const response = await signIn(client, 'user@example.com', 'wrong-password')

    response.assertStatus(401)
    response.assertBody({ error: 'Invalid email or password.' })
  })

  test('logs out an authenticated session', async ({ client }) => {
    const user = await User.create({
      email: 'user@example.com',
      encryptedPassword: 'password123',
    })

    const login = await signIn(client, user.email, 'password123')
    const csrf = await getCsrf(client, sessionCookie(login))

    const logout = await client
      .delete('/api/v1/users/sign_out')
      .header('Cookie', csrf.cookie)
      .header('X-XSRF-TOKEN', csrf.token)

    logout.assertStatus(204)

    const me = await client.get('/api/v1/me').header('Cookie', sessionCookie(logout))
    me.assertStatus(401)
  })
})
