import env from '#start/env'

export interface VerifiedNfcTag {
  identifier: string
  readCounter: number
}

export interface NfcVerificationResponse {
  status: number
  tag: VerifiedNfcTag | null
}

export interface VerifyTagParams {
  piccData: string
  enc: string
  cmac: string
}

export async function verifyTag(params: VerifyTagParams): Promise<NfcVerificationResponse> {
  const baseUrl = env.get('NFC_SERVICE_URL') ?? 'http://127.0.0.1:5000'
  const url = new URL('/api/tag', baseUrl)
  url.searchParams.set('picc_data', params.piccData)
  url.searchParams.set('enc', params.enc)
  url.searchParams.set('cmac', params.cmac)

  const upstream = await fetch(url, {
    signal: AbortSignal.timeout(7_000),
  })

  const body: unknown = await upstream.json().catch(() => null)

  return {
    status: upstream.status,
    tag: upstream.ok ? verifiedTag(body) : null,
  }
}

function verifiedTag(body: unknown): VerifiedNfcTag | null {
  if (!body || typeof body !== 'object') return null

  const result = body as Record<string, unknown>

  const { uid, read_ctr: readCounter } = result
  if (typeof uid !== 'string' || !/^[0-9a-f]{14}$/i.test(uid)) return null
  if (typeof readCounter !== 'number' || !Number.isSafeInteger(readCounter) || readCounter < 0)
    return null

  return {
    identifier: uid.toUpperCase(),
    readCounter,
  }
}
