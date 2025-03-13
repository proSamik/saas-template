import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

/**
 * Create a PostgreSQL connection pool
 * Uses the environment variable for database connection
 */
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
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