import vine from '@vinejs/vine'

/**
 * Shared rules for email and password.
 */
const email = () => vine.string().email().maxLength(254)
const password = () => vine.string().minLength(6).maxLength(128)

/**
 * Validator to use when performing self-signup
 */
export const signupValidator = vine.create({
  user: vine.object({
    email: email().trim().toLowerCase().unique({ table: 'users', column: 'email' }),
    password: password(),
    password_confirmation: password().sameAs('password'),
  }),
})

/**
 * Validator to use before validating user credentials
 * during login
 */
export const loginValidator = vine.create({
  user: vine.object({
    email: email().trim().toLowerCase(),
    password: vine.string(),
  }),
})
