import env from '#start/env'

export interface NfcVerificationResponse {
  status: number
  body: string
}

interface VerifyTagParams {
  piccData: string
  enc: string
  cmac: string
}

export default class VerifyTagService {
  constructor(private readonly params: VerifyTagParams) {}

  async call(): Promise<NfcVerificationResponse> {
    const baseUrl = env.get('NFC_SERVICE_URL') ?? 'http://127.0.0.1:5000'
    const url = new URL('/api/tag', baseUrl)
    url.searchParams.set('picc_data', this.params.piccData)
    url.searchParams.set('enc', this.params.enc)
    url.searchParams.set('cmac', this.params.cmac)

    const upstream = await fetch(url, {
      signal: AbortSignal.timeout(7_000),
    })

    return {
      status: upstream.status,
      body: await upstream.text(),
    }
  }
}
