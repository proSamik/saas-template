'use server'

import { revalidatePath } from 'next/cache';
import { analyzeTasksWithAI, generateOptimalSchedule } from '../ai/openrouter';
import { aiRecommendationQueries, taskQueries, calendarQueries } from '../db/queries';
import { tasks, calendarEvents, priorityEnum } from '../db/schema';
import { Task } from '@/types/ai-secretary';

/**
 * Server action to analyze tasks with AI
 * @param userId - The authenticated user ID
 * @param input - The input text for task analysis
 * @returns The AI-generated analysis and recommendations
 */
export async function analyzeTasksAction(userId: string, input: string) {
  try {
    console.log(`Starting AI analysis for user ${userId} with input: ${input.substring(0, 100)}...`);
    
    if (!userId) {
      console.error('analyzeTasksAction called without a userId');
      throw new Error('User ID is required for task analysis');
    }
    
    if (!input || input.trim().length === 0) {
      console.error('analyzeTasksAction called with empty input');
      throw new Error('Input text is required for task analysis');
    }
    
    // Get AI analysis - this now has better error handling internally
    const aiAnalysis = await analyzeTasksWithAI(input);
    
    // Only store the recommendation if we got a valid analysis from the AI
    if (aiAnalysis && !aiAnalysis.includes('failed') && !aiAnalysis.includes('error')) {
      try {
        // Store the recommendation
        const newRecommendation = await aiRecommendationQueries.create(userId, aiAnalysis, input);
        console.log('Successfully stored AI recommendation:', newRecommendation[0]?.id);
        
        revalidatePath('/ai-secretary');
        return { recommendation: aiAnalysis, id: newRecommendation[0]?.id };
      } catch (dbError) {
        console.error('Error storing AI recommendation in database:', dbError);
        // Return the analysis even if storing failed
        return { recommendation: aiAnalysis, id: 0 };
      }
    } else {
      // If the AI returned an error message, just return it without trying to store in DB
      console.log('AI returned an error or warning message:', aiAnalysis);
      return { recommendation: aiAnalysis, id: 0 };
    }
  } catch (error) {
    // Detailed error logging
    console.error('Error analyzing tasks with AI:', error);
    
    // Return a user-friendly error that won't crash the server
    return { 
      recommendation: 'Sorry, there was an error analyzing your tasks. Please try again later or contact support if the issue persists.', 
      id: 0,
      error: true
    };
  }
}

/**
 * Server action to generate an optimal schedule
 * @param userId - The authenticated user ID
 * @param preferences - User scheduling preferences
 * @returns The AI-generated schedule
 */
export async function generateScheduleAction(
  userId: string, 
  preferences: { workingHours?: { start: string; end: string }; focusTime?: boolean }
) {
  try {
    // Get user's tasks
    const userTasks = await taskQueries.getAll(userId);
    
    // Get user's existing calendar events
    const userEvents = await calendarQueries.getAll(userId);
    
    // Generate optimal schedule with AI
    const schedule = await generateOptimalSchedule(userTasks, userEvents, preferences);
    
    // Store the recommendation
    const newRecommendation = await aiRecommendationQueries.create(
      userId, 
      schedule, 
      JSON.stringify({ preferences, taskCount: userTasks.length, eventCount: userEvents.length })
    );
    
    revalidatePath('/ai-secretary');
    return { schedule, id: newRecommendation[0]?.id };
  } catch (error) {
    console.error('Error generating schedule with AI:', error);
    throw new Error('Failed to generate schedule with AI');
  }
}

/**
 * Server action to get all AI recommendations for a user
 * @param userId - The authenticated user ID
 * @returns All AI recommendations for the user
 */
export async function getAIRecommendations(userId: string) {
  try {
    return await aiRecommendationQueries.getAll(userId);
  } catch (error) {
    console.error('Error fetching AI recommendations:', error);
    throw new Error('Failed to fetch AI recommendations');
  }
}

/**
 * Server action to mark an AI recommendation as applied
 * @param userId - The authenticated user ID
 * @param recommendationId - The ID of the recommendation to mark as applied
 */
export async function markRecommendationApplied(userId: string, recommendationId: number) {
  try {
    const updatedRecommendation = await aiRecommendationQueries.markApplied(userId, recommendationId);
    revalidatePath('/ai-secretary');
    return updatedRecommendation;
  } catch (error) {
    console.error('Error marking recommendation as applied:', error);
    throw new Error('Failed to mark recommendation as applied');
  }
}

/**
 * Server action to create tasks from an AI recommendation
 * @param userId - The authenticated user ID
 * @param recommendationId - The ID of the recommendation to convert to tasks
 * @param recommendationText - The text of the recommendation
 * @returns Array of created tasks
 */
export async function createTasksFromRecommendation(
  userId: string, 
  recommendationId: number, 
  recommendationText: string
) {
  try {
    // Validate inputs
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    if (!recommendationText) {
      throw new Error('Recommendation text is required');
    }
    
    // Extract task suggestions from the recommendation text
    // This is a simple implementation - in a real app, you might want to use AI to extract structured tasks
    const lines = recommendationText.split('\n');
    const taskLines = lines.filter(line => 
      (line.includes('Task:') || 
       line.includes('Priority:') || 
       line.trim().startsWith('•') || 
       line.trim().startsWith('-')) && 
      line.length > 5
    );
    
    // Group related lines together
    const taskBlocks: string[] = [];
    let currentBlock = '';
    
    for (const line of taskLines) {
      if ((line.includes('Task:') || line.trim().startsWith('•') || line.trim().startsWith('-')) && currentBlock !== '') {
        taskBlocks.push(currentBlock);
        currentBlock = line;
      } else {
        currentBlock += '\n' + line;
      }
    }
    
    if (currentBlock !== '') {
      taskBlocks.push(currentBlock);
    }
    
    // Parse blocks into tasks
    const createdTasks: Task[] = [];
    
    for (const block of taskBlocks) {
      let title = '';
      let description = block.trim();
      let priority: typeof priorityEnum.enumValues[number] = 'NOT_URGENT_IMPORTANT'; // Default priority
      
      // Try to extract task title
      if (block.includes('Task:')) {
        const titleMatch = block.match(/Task:\s*([^\n]+)/);
        if (titleMatch && titleMatch[1]) {
          title = titleMatch[1].trim();
        }
      } else if (block.trim().startsWith('•') || block.trim().startsWith('-')) {
        const lines = block.trim().split('\n');
        title = lines[0].replace(/^[•-]\s*/, '').trim();
      }
      
      // Skip if we couldn't extract a title
      if (!title) continue;
      
      // Try to determine priority based on text
      if (block.toLowerCase().includes('urgent') && block.toLowerCase().includes('important')) {
        priority = 'URGENT_IMPORTANT';
      } else if (block.toLowerCase().includes('urgent')) {
        priority = 'URGENT_NOT_IMPORTANT';
      } else if (block.toLowerCase().includes('important')) {
        priority = 'NOT_URGENT_IMPORTANT';
      } else if (block.toLowerCase().includes('not urgent') && block.toLowerCase().includes('not important')) {
        priority = 'NOT_URGENT_NOT_IMPORTANT';
      }
      
      // Create task
      try {
        const taskData = {
          title,
          description,
          priority,
        };
        
        const newTask = await taskQueries.create(userId, taskData);
        if (newTask && newTask[0]) {
          createdTasks.push(newTask[0]);
        }
      } catch (error) {
        console.error('Error creating task from recommendation:', error);
        // Continue with the next task even if one fails
      }
    }
    
    // If we didn't create any tasks, create at least one general task
    if (createdTasks.length === 0) {
      const taskData = {
        title: 'Task from AI recommendation',
        description: recommendationText,
        priority: 'NOT_URGENT_IMPORTANT' as typeof priorityEnum.enumValues[number],
      };
      
      const newTask = await taskQueries.create(userId, taskData);
      if (newTask && newTask[0]) {
        createdTasks.push(newTask[0]);
      }
    }
    
    // Mark the recommendation as applied
    await markRecommendationApplied(userId, recommendationId);
    
    revalidatePath('/ai-secretary');
    return createdTasks;
  } catch (error) {
    console.error('Error creating tasks from recommendation:', error);
    throw new Error('Failed to create tasks from recommendation');
  }
} 