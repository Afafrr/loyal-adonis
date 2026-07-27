import type { ApiClient, ApiResponse } from '@japa/api-client'

export interface CsrfSession {
  cookie: string
  token: string
}

export function sessionCookie(response: ApiResponse): string {
  const setCookie = response.header('set-cookie') as string | string[] | undefined
  const cookies = Array.isArray(setCookie) ? setCookie : (setCookie?.split(/,(?=\s*[^;,]+=)/) ?? [])
  const cookiePairs = cookies.map((cookie) => cookie.trim().split(';', 1)[0])
  const session = cookiePairs.find((cookie) => cookie.startsWith('_loyal_session='))

  if (!session) {
    throw new Error('Expected the response to set the session cookie')
  }

  return cookiePairs.join('; ')
}

export async function getCsrf(client: ApiClient, cookie?: string): Promise<CsrfSession> {
  const request = client.get('/api/v1/csrf')

  if (cookie) {
    request.header('Cookie', cookie)
  }

  const response = await request
  response.assertStatus(200)

  return {
    cookie: sessionCookie(response),
    token: response.body().csrf_token,
  }
}

export async function signIn(
  client: ApiClient,
  email: string,
  password: string
): Promise<ApiResponse> {
  const csrf = await getCsrf(client)

  return client
    .post('/api/v1/users/sign_in')
    .header('Cookie', csrf.cookie)
    .header('X-CSRF-Token', csrf.token)
    .json({ user: { email, password } })
}
