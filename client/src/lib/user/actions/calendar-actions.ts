'use server'

import { revalidatePath } from 'next/cache';
import { calendarQueries } from '../db/queries';

/**
 * Server action to get all calendar events for a user
 * @param userId - The authenticated user ID
 */
export async function getCalendarEvents(userId: string) {
  try {
    return await calendarQueries.getAll(userId);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw new Error('Failed to fetch calendar events');
  }
}

/**
 * Server action to get calendar events for a specific date range
 * @param userId - The authenticated user ID
 * @param startDate - Start of the date range
 * @param endDate - End of the date range
 */
export async function getCalendarEventsByDateRange(userId: string, startDate: Date, endDate: Date) {
  try {
    return await calendarQueries.getByDateRange(userId, startDate, endDate);
  } catch (error) {
    console.error('Error fetching calendar events by date range:', error);
    throw new Error('Failed to fetch calendar events by date range');
  }
}

/**
 * Server action to create a new calendar event
 * @param userId - The authenticated user ID
 * @param formData - The form data containing event details
 */
export async function createCalendarEvent(userId: string, formData: FormData) {
  try {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const startTimeStr = formData.get('startTime') as string;
    const endTimeStr = formData.get('endTime') as string;
    const taskId = parseInt(formData.get('taskId') as string);
    const isAllDay = formData.get('isAllDay') === 'true';
    
    // Validate required fields
    if (!title || !startTimeStr || !endTimeStr) {
      throw new Error('Title, start time, and end time are required');
    }
    
    // Parse dates
    const startTime = new Date(startTimeStr);
    const endTime = new Date(endTimeStr);
    
    // Validate end time is after start time
    if (endTime <= startTime) {
      throw new Error('End time must be after start time');
    }
    
    const newEvent = await calendarQueries.create(userId, {
      title,
      description,
      startTime,
      endTime,
      taskId: isNaN(taskId) ? undefined : taskId,
      isAllDay,
    });
    
    revalidatePath('/ai-secretary');
    return newEvent;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw new Error('Failed to create calendar event');
  }
}

/**
 * Server action to update an existing calendar event
 * @param userId - The authenticated user ID
 * @param eventId - The ID of the event to update
 * @param formData - The form data containing updated event details
 */
export async function updateCalendarEvent(userId: string, eventId: number, formData: FormData) {
  try {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const startTimeStr = formData.get('startTime') as string;
    const endTimeStr = formData.get('endTime') as string;
    const taskId = parseInt(formData.get('taskId') as string);
    const isAllDay = formData.get('isAllDay') === 'true';
    
    // Parse dates if provided
    const startTime = startTimeStr ? new Date(startTimeStr) : undefined;
    const endTime = endTimeStr ? new Date(endTimeStr) : undefined;
    
    // Validate end time is after start time if both are provided
    if (startTime && endTime && endTime <= startTime) {
      throw new Error('End time must be after start time');
    }
    
    const updatedEvent = await calendarQueries.update(userId, eventId, {
      title,
      description,
      startTime,
      endTime,
      taskId: isNaN(taskId) ? undefined : taskId,
      isAllDay,
    });
    
    revalidatePath('/ai-secretary');
    return updatedEvent;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw new Error('Failed to update calendar event');
  }
}

/**
 * Server action to delete a calendar event
 * @param userId - The authenticated user ID
 * @param eventId - The ID of the event to delete
 */
export async function deleteCalendarEvent(userId: string, eventId: number) {
  try {
    const deletedEvent = await calendarQueries.delete(userId, eventId);
    revalidatePath('/ai-secretary');
    return deletedEvent;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw new Error('Failed to delete calendar event');
  }
} 