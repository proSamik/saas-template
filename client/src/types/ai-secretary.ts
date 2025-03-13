import { priorityEnum, tasks, calendarEvents, aiRecommendations } from '@/lib/user/db/schema';

/**
 * Task type definition
 */
export type Task = typeof tasks.$inferSelect;

/**
 * Calendar event type definition
 */
export type CalendarEvent = typeof calendarEvents.$inferSelect;

/**
 * AI recommendation type definition
 */
export type AIRecommendation = typeof aiRecommendations.$inferSelect;

/**
 * Priority values from the Eisenhower matrix
 */
export type Priority = typeof priorityEnum.enumValues[number];

/**
 * Working hours preference type
 */
export type WorkingHours = {
  start: string;
  end: string;
};

/**
 * User scheduling preferences type
 */
export type SchedulingPreferences = {
  workingHours?: WorkingHours;
  focusTime?: boolean;
};

/**
 * Task form data for creation/updating
 */
export type TaskFormData = {
  title: string;
  description?: string;
  priority: Priority;
  dueDate?: Date | string;
  estimatedTimeMinutes?: number;
  actualTimeMinutes?: number;
  isCompleted?: boolean;
};

/**
 * Calendar event form data for creation/updating
 */
export type CalendarEventFormData = {
  title: string;
  description?: string;
  startTime: Date | string;
  endTime: Date | string;
  taskId?: number;
  isAllDay?: boolean;
}; 