import { pgTable, serial, varchar, timestamp, boolean, integer, text, pgEnum } from 'drizzle-orm/pg-core';

/**
 * Enum for task priority levels based on Eisenhower Matrix
 * - URGENT_IMPORTANT: Q1 - Do First (urgent and important)
 * - NOT_URGENT_IMPORTANT: Q2 - Schedule (not urgent but important)
 * - URGENT_NOT_IMPORTANT: Q3 - Delegate (urgent but not important)
 * - NOT_URGENT_NOT_IMPORTANT: Q4 - Eliminate (not urgent and not important)
 */
export const priorityEnum = pgEnum('priority', [
  'URGENT_IMPORTANT',
  'NOT_URGENT_IMPORTANT', 
  'URGENT_NOT_IMPORTANT',
  'NOT_URGENT_NOT_IMPORTANT'
]);

/**
 * Tasks table schema
 * Stores user tasks with Eisenhower Matrix categorization
 */
export const tasks = pgTable('user_tasks', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 256 }).notNull(),
  title: varchar('title', { length: 256 }).notNull(),
  description: text('description'),
  priority: priorityEnum('priority').notNull(),
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  isCompleted: boolean('is_completed').default(false),
  estimatedTimeMinutes: integer('estimated_time_minutes'),
  actualTimeMinutes: integer('actual_time_minutes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  isDeleted: boolean('is_deleted').default(false),
});

/**
 * Calendar events table schema
 * Stores scheduled blocks of time for tasks
 */
export const calendarEvents = pgTable('user_calendar_events', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 256 }).notNull(),
  taskId: integer('task_id').references(() => tasks.id),
  title: varchar('title', { length: 256 }).notNull(),
  description: text('description'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  isAllDay: boolean('is_all_day').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  isDeleted: boolean('is_deleted').default(false),
});

/**
 * AI recommendations table schema
 * Stores AI generated recommendations for task scheduling and prioritization
 */
export const aiRecommendations = pgTable('user_ai_recommendations', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 256 }).notNull(),
  recommendation: text('recommendation').notNull(),
  context: text('context'),
  isApplied: boolean('is_applied').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  appliedAt: timestamp('applied_at'),
  isDeleted: boolean('is_deleted').default(false),
}); 