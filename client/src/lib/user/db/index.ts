import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

/**
 * Create a PostgreSQL connection pool
 * Uses environment variables for database connection
 */
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'saas-app',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  ssl: false
});

/**
 * Initialize Drizzle ORM with the connection pool and schema
 */
export const db = drizzle(pool, { schema });

/**
 * Helper function to get the userId from the auth context
 * and ensure data operations are scoped to the current user
 * @param userId - The authenticated user's ID
 * @returns Object with userId for consistent querying
 * @throws Error if userId is not provided
 */
export function getUserContext(userId: string | null | undefined) {
  // Check if userId exists and is not empty
  if (!userId || userId.trim() === '') {
    console.error('getUserContext called with invalid userId:', userId);
    throw new Error('User not authenticated or invalid user ID');
  }
  
  return { userId };
} 