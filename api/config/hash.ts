import { defineConfig, drivers } from '@adonisjs/core/hash'

const hashConfig = defineConfig({
  default: 'bcrypt',

  list: {
    // Devise uses bcrypt with cost 12. This also verifies existing Rails hashes.
    bcrypt: drivers.bcrypt({
      rounds: 12,
    }),
  },
})

export default hashConfig

/**
 * Inferring types for the list of hashers you have configured
 * in your application.
 */
declare module '@adonisjs/core/types' {
  export interface HashersList extends InferHashers<typeof hashConfig> {}
}
