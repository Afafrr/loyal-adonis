import env from '#start/env'
import http from 'node:http'
import https from 'node:https'

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

    return new Promise((resolve, reject) => {
      const client = url.protocol === 'https:' ? https : http
      let clearConnectTimeout = () => {}
      const request = client.get(url, (upstream) => {
        const chunks: Buffer[] = []

        upstream.setTimeout(5_000, () => {
          upstream.destroy(new Error('NFC service read timeout'))
        })
        upstream.on('data', (chunk: Buffer) => chunks.push(chunk))
        upstream.on('end', () => {
          resolve({
            status: upstream.statusCode ?? 500,
            body: Buffer.concat(chunks).toString('utf8'),
          })
        })
        upstream.on('error', reject)
      })

      request.once('socket', (socket) => {
        if (!socket.connecting) {
          return
        }

        const connectedEvent = url.protocol === 'https:' ? 'secureConnect' : 'connect'
        const onConnectTimeout = () => {
          request.destroy(new Error('NFC service connection timeout'))
        }

        clearConnectTimeout = () => {
          socket.setTimeout(0)
          socket.off('timeout', onConnectTimeout)
        }

        socket.setTimeout(2_000)
        socket.once('timeout', onConnectTimeout)
        socket.once(connectedEvent, clearConnectTimeout)
      })
      request.once('error', (error) => {
        clearConnectTimeout()
        reject(error)
      })
    })
  }
}
