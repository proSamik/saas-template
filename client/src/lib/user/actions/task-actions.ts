'use server'

import { revalidatePath } from 'next/cache';
import { taskQueries } from '../db/queries';
import { priorityEnum } from '../db/schema';

/**
 * Server action to get all tasks for a user
 * @param userId - The authenticated user ID
 */
export async function getTasks(userId: string) {
  try {
    return await taskQueries.getAll(userId);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw new Error('Failed to fetch tasks');
  }
}

/**
 * Server action to get tasks filtered by priority
 * @param userId - The authenticated user ID
 * @param priority - The priority level from the Eisenhower matrix
 */
export async function getTasksByPriority(userId: string, priority: typeof priorityEnum.enumValues[number]) {
  try {
    return await taskQueries.getByPriority(userId, priority);
  } catch (error) {
    console.error(`Error fetching tasks with priority ${priority}:`, error);
    throw new Error('Failed to fetch tasks by priority');
  }
}

/**
 * Server action to create a new task
 * @param userId - The authenticated user ID
 * @param formData - The form data containing task details
 */
export async function createTask(userId: string, formData: FormData) {
  try {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const priority = formData.get('priority') as typeof priorityEnum.enumValues[number];
    const dueDateStr = formData.get('dueDate') as string;
    const estimatedTimeMinutes = parseInt(formData.get('estimatedTimeMinutes') as string);
    
    // Validate required fields
    if (!title || !priority) {
      throw new Error('Title and priority are required');
    }
    
    // Parse dueDate if provided
    const dueDate = dueDateStr ? new Date(dueDateStr) : undefined;
    
    const newTask = await taskQueries.create(userId, {
      title,
      description,
      priority,
      dueDate,
      estimatedTimeMinutes: isNaN(estimatedTimeMinutes) ? undefined : estimatedTimeMinutes,
    });
    
    revalidatePath('/ai-secretary');
    return newTask;
  } catch (error) {
    console.error('Error creating task:', error);
    throw new Error('Failed to create task');
  }
}

/**
 * Server action to update an existing task
 * @param userId - The authenticated user ID
 * @param taskId - The ID of the task to update
 * @param formData - The form data containing updated task details
 */
export async function updateTask(userId: string, taskId: number, formData: FormData) {
  try {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const priority = formData.get('priority') as typeof priorityEnum.enumValues[number];
    const dueDateStr = formData.get('dueDate') as string;
    const estimatedTimeMinutes = parseInt(formData.get('estimatedTimeMinutes') as string);
    const actualTimeMinutes = parseInt(formData.get('actualTimeMinutes') as string);
    const isCompleted = formData.get('isCompleted') === 'true';
    
    // Parse dueDate if provided
    const dueDate = dueDateStr ? new Date(dueDateStr) : undefined;
    
    const updatedTask = await taskQueries.update(userId, taskId, {
      title,
      description,
      priority,
      dueDate,
      estimatedTimeMinutes: isNaN(estimatedTimeMinutes) ? undefined : estimatedTimeMinutes,
      actualTimeMinutes: isNaN(actualTimeMinutes) ? undefined : actualTimeMinutes,
      isCompleted,
      completedAt: isCompleted ? new Date() : undefined,
    });
    
    revalidatePath('/ai-secretary');
    return updatedTask;
  } catch (error) {
    console.error('Error updating task:', error);
    throw new Error('Failed to update task');
  }
}

/**
 * Server action to mark a task as complete
 * @param userId - The authenticated user ID
 * @param taskId - The ID of the task to mark as complete
 */
export async function completeTask(userId: string, taskId: number) {
  try {
    const updatedTask = await taskQueries.markComplete(userId, taskId);
    revalidatePath('/ai-secretary');
    return updatedTask;
  } catch (error) {
    console.error('Error completing task:', error);
    throw new Error('Failed to mark task as complete');
  }
}

/**
 * Server action to delete a task
 * @param userId - The authenticated user ID
 * @param taskId - The ID of the task to delete
 */
export async function deleteTask(userId: string, taskId: number) {
  try {
    const deletedTask = await taskQueries.delete(userId, taskId);
    revalidatePath('/ai-secretary');
    return deletedTask;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw new Error('Failed to delete task');
  }
} 