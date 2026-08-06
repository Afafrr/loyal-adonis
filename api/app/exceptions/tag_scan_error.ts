export default class TagScanError extends Error {
  constructor(
    message: string,
    readonly status: 404 | 409
  ) {
    super(message)
  }
}
