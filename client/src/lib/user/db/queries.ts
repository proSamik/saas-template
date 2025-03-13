import { desc, eq, and, gte, lte, isNull } from 'drizzle-orm';
import { db, getUserContext } from './index';
import { tasks, calendarEvents, aiRecommendations, priorityEnum } from './schema';

/**
 * Task management queries
 */
export const taskQueries = {
  /**
   * Get all tasks for a user
   * @param userId - The authenticated user's ID
   * @returns All tasks for the user that aren't deleted
   */
  getAll: async (userId: string) => {
    const { userId: contextUserId } = getUserContext(userId);
    
    return db.select()
      .from(tasks)
      .where(and(
        eq(tasks.userId, contextUserId),
        eq(tasks.isDeleted, false)
      ))
      .orderBy(desc(tasks.createdAt));
  },
  
  /**
   * Get tasks by priority quadrant (Eisenhower matrix)
   * @param userId - The authenticated user's ID
   * @param priority - The priority level from the Eisenhower matrix
   * @returns Tasks matching the priority quadrant
   */
  getByPriority: async (userId: string, priority: typeof priorityEnum.enumValues[number]) => {
    const { userId: contextUserId } = getUserContext(userId);
    
    return db.select()
      .from(tasks)
      .where(and(
        eq(tasks.userId, contextUserId),
        eq(tasks.priority, priority),
        eq(tasks.isDeleted, false)
      ))
      .orderBy(desc(tasks.createdAt));
  },
  
  /**
   * Create a new task
   * @param userId - The authenticated user's ID
   * @param taskData - The task data to insert
   * @returns The created task
   */
  create: async (userId: string, taskData: Omit<typeof tasks.$inferInsert, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => {
    const { userId: contextUserId } = getUserContext(userId);
    
    return db.insert(tasks)
      .values({
        ...taskData,
        userId: contextUserId,
      })
      .returning();
  },
  
  /**
   * Update an existing task
   * @param userId - The authenticated user's ID 
   * @param taskId - The ID of the task to update
   * @param taskData - The updated task data
   * @returns The updated task
   */
  update: async (userId: string, taskId: number, taskData: Partial<Omit<typeof tasks.$inferInsert, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isDeleted'>>) => {
    const { userId: contextUserId } = getUserContext(userId);
    
    return db.update(tasks)
      .set({
        ...taskData,
        updatedAt: new Date(),
      })
      .where(and(
        eq(tasks.id, taskId),
        eq(tasks.userId, contextUserId),
        eq(tasks.isDeleted, false)
      ))
      .returning();
  },
  
  /**
   * Mark a task as complete
   * @param userId - The authenticated user's ID
   * @param taskId - The ID of the task to complete
   * @returns The updated task
   */
  markComplete: async (userId: string, taskId: number) => {
    const { userId: contextUserId } = getUserContext(userId);
    
    return db.update(tasks)
      .set({
        isCompleted: true,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(
        eq(tasks.id, taskId),
        eq(tasks.userId, contextUserId),
        eq(tasks.isDeleted, false)
      ))
      .returning();
  },
  
  /**
   * Soft delete a task
   * @param userId - The authenticated user's ID
   * @param taskId - The ID of the task to delete
   * @returns The deleted task
   */
  delete: async (userId: string, taskId: number) => {
    const { userId: contextUserId } = getUserContext(userId);
    
    return db.update(tasks)
      .set({
        isDeleted: true,
        updatedAt: new Date(),
      })
      .where(and(
        eq(tasks.id, taskId),
        eq(tasks.userId, contextUserId)
      ))
      .returning();
  },
};

/**
 * Calendar event queries
 */
export const calendarQueries = {
  /**
   * Get all calendar events for a user
   * @param userId - The authenticated user's ID
   * @returns All calendar events for the user
   */
  getAll: async (userId: string) => {
    const { userId: contextUserId } = getUserContext(userId);
    
    return db.select()
      .from(calendarEvents)
      .where(and(
        eq(calendarEvents.userId, contextUserId),
        eq(calendarEvents.isDeleted, false)
      ))
      .orderBy(desc(calendarEvents.startTime));
  },
  
  /**
   * Get calendar events for a specific date range
   * @param userId - The authenticated user's ID
   * @param startDate - Start of the date range
   * @param endDate - End of the date range
   * @returns Calendar events in the date range
   */
  getByDateRange: async (userId: string, startDate: Date, endDate: Date) => {
    const { userId: contextUserId } = getUserContext(userId);
    
    return db.select()
      .from(calendarEvents)
      .where(and(
        eq(calendarEvents.userId, contextUserId),
        eq(calendarEvents.isDeleted, false),
        lte(calendarEvents.startTime, endDate),
        gte(calendarEvents.endTime, startDate)
      ))
      .orderBy(desc(calendarEvents.startTime));
  },
  
  /**
   * Create a new calendar event
   * @param userId - The authenticated user's ID
   * @param eventData - The calendar event data
   * @returns The created calendar event
   */
  create: async (userId: string, eventData: Omit<typeof calendarEvents.$inferInsert, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isDeleted'>) => {
    const { userId: contextUserId } = getUserContext(userId);
    
    return db.insert(calendarEvents)
      .values({
        ...eventData,
        userId: contextUserId,
      })
      .returning();
  },
  
  /**
   * Update an existing calendar event
   * @param userId - The authenticated user's ID
   * @param eventId - The ID of the event to update
   * @param eventData - The updated event data
   * @returns The updated calendar event
   */
  update: async (userId: string, eventId: number, eventData: Partial<Omit<typeof calendarEvents.$inferInsert, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isDeleted'>>) => {
    const { userId: contextUserId } = getUserContext(userId);
    
    return db.update(calendarEvents)
      .set({
        ...eventData,
        updatedAt: new Date(),
      })
      .where(and(
        eq(calendarEvents.id, eventId),
        eq(calendarEvents.userId, contextUserId),
        eq(calendarEvents.isDeleted, false)
      ))
      .returning();
  },
  
  /**
   * Soft delete a calendar event
   * @param userId - The authenticated user's ID
   * @param eventId - The ID of the event to delete
   * @returns The deleted calendar event
   */
  delete: async (userId: string, eventId: number) => {
    const { userId: contextUserId } = getUserContext(userId);
    
    return db.update(calendarEvents)
      .set({
        isDeleted: true,
        updatedAt: new Date(),
      })
      .where(and(
        eq(calendarEvents.id, eventId),
        eq(calendarEvents.userId, contextUserId)
      ))
      .returning();
  },
};

/**
 * AI recommendations queries
 */
export const aiRecommendationQueries = {
  /**
   * Get all AI recommendations for a user
   * @param userId - The authenticated user's ID
   * @returns All AI recommendations for the user
   */
  getAll: async (userId: string) => {
    const { userId: contextUserId } = getUserContext(userId);
    
    return db.select()
      .from(aiRecommendations)
      .where(and(
        eq(aiRecommendations.userId, contextUserId),
        eq(aiRecommendations.isDeleted, false)
      ))
      .orderBy(desc(aiRecommendations.createdAt));
  },
  
  /**
   * Create a new AI recommendation
   * @param userId - The authenticated user's ID
   * @param recommendation - The recommendation text
   * @param context - Optional context for the recommendation
   * @returns The created recommendation
   */
  create: async (userId: string, recommendation: string, context?: string) => {
    const { userId: contextUserId } = getUserContext(userId);
    
    return db.insert(aiRecommendations)
      .values({
        userId: contextUserId,
        recommendation,
        context,
      })
      .returning();
  },
  
  /**
   * Mark a recommendation as applied
   * @param userId - The authenticated user's ID
   * @param recommendationId - The ID of the recommendation
   * @returns The updated recommendation
   */
  markApplied: async (userId: string, recommendationId: number) => {
    const { userId: contextUserId } = getUserContext(userId);
    
    return db.update(aiRecommendations)
      .set({
        isApplied: true,
        appliedAt: new Date(),
      })
      .where(and(
        eq(aiRecommendations.id, recommendationId),
        eq(aiRecommendations.userId, contextUserId),
        eq(aiRecommendations.isDeleted, false)
      ))
      .returning();
  },
}; 