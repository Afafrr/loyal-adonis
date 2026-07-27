import { type SchemaRules } from '@adonisjs/lucid/types/schema_generator'

/**
 * Keep authentication secrets out of Lucid's serialized model output.
 *
 * These rules are table-scoped because the Rails-compatible column names do
 * not match Lucid's built-in `password` rule. The schema generator applies
 * nullability after the rule, so `reset_password_token` deliberately uses the
 * base `string` type here.
 */
export default {
  tables: {
    users: {
      columns: {
        encrypted_password: {
          tsType: 'string',
          decorators: [{ name: '@column', args: { serializeAs: null } }],
        },
        reset_password_token: {
          tsType: 'string',
          decorators: [{ name: '@column', args: { serializeAs: null } }],
        },
      },
    },
  },
} satisfies SchemaRules
