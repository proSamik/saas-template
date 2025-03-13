import type { Config } from 'drizzle-kit'
import * as dotenv from 'dotenv'

dotenv.config()

export default {
  schema: './src/lib/user/db/schema.ts',
  out: './src/lib/user/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.POSTGRES_HOST || 'localhost',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'saas-app',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    ssl: false
  },
  verbose: true,
  strict: true,
} as Config 