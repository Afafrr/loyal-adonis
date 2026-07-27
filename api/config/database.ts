import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const dbConfig = defineConfig({
  connection: 'postgres',

  connections: {
    postgres: {
      client: 'pg',
      connection: env.get('DATABASE_URL'),
      pool: {
        min: 2,
        max: 5,
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
      schemaGeneration: {
        enabled: true,
        rulesPaths: ['./database/schema_rules.js'],
      },
    },
  },
})

export default dbConfig
