export default class NfcVerificationError extends Error {
  constructor(
    message: string,
    readonly status: 502 | 503
  ) {
    super(message)
    this.name = 'NfcVerificationError'
  }
}
