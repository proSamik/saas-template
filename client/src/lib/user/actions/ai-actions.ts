'use server'

import { revalidatePath } from 'next/cache';
import { analyzeTasksWithAI, generateOptimalSchedule } from '../ai/openrouter';
import { aiRecommendationQueries, taskQueries, calendarQueries } from '../db/queries';
import { tasks, calendarEvents } from '../db/schema';

/**
 * Server action to analyze tasks with AI
 * @param userId - The authenticated user ID
 * @param input - The input text for task analysis
 * @returns The AI-generated analysis and recommendations
 */
export async function analyzeTasksAction(userId: string, input: string) {
  try {
    // Get AI analysis
    const aiAnalysis = await analyzeTasksWithAI(input);
    
    // Store the recommendation
    const newRecommendation = await aiRecommendationQueries.create(userId, aiAnalysis, input);
    
    revalidatePath('/ai-secretary');
    return { recommendation: aiAnalysis, id: newRecommendation[0]?.id };
  } catch (error) {
    console.error('Error analyzing tasks with AI:', error);
    throw new Error('Failed to analyze tasks with AI');
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