import env from '#start/env'
import NfcVerificationError from '#exceptions/nfc_verification_error'

const verifierTimeoutMs = 7_000
const temporarilyUnavailableMessage =
  'NFC verification service is temporarily unavailable. Please try again.'
const invalidResponseMessage =
  'NFC verification service returned an invalid response. Please try again.'

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
  const verifierResponse = await requestVerifier(buildVerifierUrl(params))

  if (!verifierResponse.accepted) {
    return { status: verifierResponse.status, tag: null }
  }

  const tag = parseVerifiedTag(verifierResponse.body)

  if (!tag) {
    throw invalidVerifierResponse()
  }

  return {
    status: verifierResponse.status,
    tag,
  }
}

function buildVerifierUrl(params: VerifyTagParams) {
  const baseUrl = env.get('NFC_SERVICE_URL') ?? 'http://127.0.0.1:5000'
  const url = new URL('/api/tag', baseUrl)
  url.searchParams.set('picc_data', params.piccData)
  url.searchParams.set('enc', params.enc)
  url.searchParams.set('cmac', params.cmac)

  return url
}

type VerifierResponse =
  { accepted: false; status: number } | { accepted: true; status: number; body: unknown }

async function requestVerifier(url: URL): Promise<VerifierResponse> {
  let upstream: Response

  try {
    upstream = await fetch(url, {
      signal: AbortSignal.timeout(verifierTimeoutMs),
    })
  } catch {
    throw verifierUnavailable()
  }

  if ([408, 429, 503, 504].includes(upstream.status)) {
    throw verifierUnavailable()
  }

  if (upstream.status >= 500) {
    throw invalidVerifierResponse()
  }

  if (!upstream.ok) {
    return { accepted: false, status: upstream.status }
  }

  try {
    return {
      accepted: true,
      status: upstream.status,
      body: await upstream.json(),
    }
  } catch {
    throw invalidVerifierResponse()
  }
}

function verifierUnavailable() {
  return new NfcVerificationError(temporarilyUnavailableMessage, 503)
}

function invalidVerifierResponse() {
  return new NfcVerificationError(invalidResponseMessage, 502)
}

function parseVerifiedTag(body: unknown): VerifiedNfcTag | null {
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
