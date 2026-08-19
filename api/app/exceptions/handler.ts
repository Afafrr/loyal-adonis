import app from '@adonisjs/core/services/app'
import NfcVerificationError from '#exceptions/nfc_verification_error'
import TagScanError from '#exceptions/tag_scan_error'
import { type HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import { errors as authErrors } from '@adonisjs/auth'
import { errors as bouncerErrors } from '@adonisjs/bouncer'
import { errors as shieldErrors } from '@adonisjs/shield'

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    if (error instanceof shieldErrors.E_BAD_CSRF_TOKEN) {
      return ctx.response.status(403).send({ error: 'Invalid CSRF token' })
    }

    if (error instanceof authErrors.E_UNAUTHORIZED_ACCESS) {
      return ctx.response.status(401).send({
        error: 'You need to sign in or sign up before continuing.',
      })
    }

    if (error instanceof authErrors.E_INVALID_CREDENTIALS) {
      return ctx.response.status(401).send({ error: 'Invalid email or password.' })
    }

    if (error instanceof bouncerErrors.E_AUTHORIZATION_FAILURE) {
      return ctx.response.status(error.status).send({ error: error.message })
    }

    if (error instanceof TagScanError) {
      return ctx.response.status(error.status).send({ error: error.message })
    }

    if (error instanceof NfcVerificationError) {
      return ctx.response.status(error.status).send({ error: error.message })
    }

    return super.handle(error, ctx)
  }

  /**
   * The method is used to report error to the logging service or
   * the a third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}
