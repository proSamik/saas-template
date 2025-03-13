'use server'

import { revalidatePath } from 'next/cache';
import { analyzeTasksWithAI, generateOptimalSchedule } from '../ai/openrouter';
import { aiRecommendationQueries, taskQueries, calendarQueries } from '../db/queries';
import { tasks, calendarEvents, priorityEnum } from '../db/schema';
import { Task, AIRecommendation } from '@/types/ai-secretary';

/**
 * MCP Server Interface for Task Management
 */
interface TaskMCPInterface {
  analyzeTasks(userId: string, input: string): Promise<{
    recommendation: string;
    id: number;
    error?: boolean;
  }>;
  createTasksFromRecommendation(
    userId: string,
    recommendationId: number,
    recommendationText: string
  ): Promise<Task[]>;
}

/**
 * MCP Server Interface for Calendar Management
 */
interface CalendarMCPInterface {
  generateSchedule(
    userId: string,
    preferences: { workingHours?: { start: string; end: string }; focusTime?: boolean }
  ): Promise<{ schedule: string; id: number }>;
}

/**
 * MCP Server Implementation for Task Management
 */
class TaskMCPServer implements TaskMCPInterface {
  /**
   * Analyze tasks using AI and create recommendations
   * @param userId - The authenticated user ID
   * @param input - The input text for task analysis
   * @returns The AI-generated analysis and recommendations
   */
  async analyzeTasks(userId: string, input: string) {
    try {
      console.log(`Starting AI analysis for user ${userId} with input: ${input.substring(0, 100)}...`);
      
      if (!userId) {
        throw new Error('User ID is required for task analysis');
      }
      
      if (!input || input.trim().length === 0) {
        throw new Error('Input text is required for task analysis');
      }
      
      // Get AI analysis
      const aiAnalysis = await analyzeTasksWithAI(input);
      
      // Process and store the recommendation
      if (aiAnalysis && !aiAnalysis.includes('failed') && !aiAnalysis.includes('error')) {
        const newRecommendation = await aiRecommendationQueries.create(userId, aiAnalysis, input);
        revalidatePath('/ai-secretary');
        return { recommendation: aiAnalysis, id: newRecommendation[0]?.id };
      }
      
      return { recommendation: aiAnalysis, id: 0 };
    } catch (error) {
      console.error('Error analyzing tasks with AI:', error);
      return { 
        recommendation: 'Sorry, there was an error analyzing your tasks. Please try again later.', 
        id: 0,
        error: true
      };
    }
  }

  /**
   * Create tasks from AI recommendations using the Eisenhower Matrix
   * @param userId - The authenticated user ID
   * @param recommendationId - The ID of the recommendation
   * @param recommendationText - The text of the recommendation
   * @returns Array of created tasks
   */
  async createTasksFromRecommendation(
    userId: string, 
    recommendationId: number, 
    recommendationText: string
  ) {
    try {
      if (!userId || !recommendationText) {
        throw new Error('Missing required parameters');
      }

      // Extract and categorize tasks using the Eisenhower Matrix
      const tasks = this.categorizeTasks(recommendationText);
      
      // Create tasks in the database
      const createdTasks = await Promise.all(
        tasks.map(task => taskQueries.create(userId, task))
      );

      // Mark recommendation as applied if it exists
      if (recommendationId > 0) {
        await aiRecommendationQueries.markApplied(userId, recommendationId);
      }

      revalidatePath('/ai-secretary');
      return createdTasks.map(task => task[0]).filter(Boolean);
    } catch (error) {
      console.error('Error creating tasks from recommendation:', error);
      throw new Error(`Failed to create tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Categorize tasks using the Eisenhower Matrix
   * @param text - The recommendation text
   * @returns Array of categorized tasks
   */
  private categorizeTasks(text: string) {
    const lines = text.split('\n');
    const taskBlocks = this.extractTaskBlocks(lines);
    
    return taskBlocks.map(block => {
      const { title, description } = this.extractTaskDetails(block);
      const priority = this.determinePriority(block);
      
      return {
        title,
        description,
        priority,
      };
    });
  }

  /**
   * Extract task blocks from text
   */
  private extractTaskBlocks(lines: string[]) {
    const taskLines = lines.filter(line => 
      (line.includes('Task:') || 
       line.includes('Priority:') || 
       line.trim().startsWith('•') || 
       line.trim().startsWith('-')) && 
      line.length > 5
    );
    
    const blocks: string[] = [];
    let currentBlock = '';
    
    for (const line of taskLines) {
      if ((line.includes('Task:') || line.trim().startsWith('•') || line.trim().startsWith('-')) && currentBlock !== '') {
        blocks.push(currentBlock);
        currentBlock = line;
      } else {
        currentBlock += '\n' + line;
      }
    }
    
    if (currentBlock !== '') {
      blocks.push(currentBlock);
    }
    
    return blocks;
  }

  /**
   * Extract task details from a block
   */
  private extractTaskDetails(block: string) {
    let title = '';
    let description = block.trim();
    
    if (block.includes('Task:')) {
      const titleMatch = block.match(/Task:\s*([^\n]+)/);
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1].trim();
      }
    } else if (block.trim().startsWith('•') || block.trim().startsWith('-')) {
      const lines = block.trim().split('\n');
      title = lines[0].replace(/^[•-]\s*/, '').trim();
    }
    
    return { title, description };
  }

  /**
   * Determine task priority using the Eisenhower Matrix
   */
  private determinePriority(block: string): typeof priorityEnum.enumValues[number] {
    const text = block.toLowerCase();
    
    if (text.includes('urgent') && text.includes('important')) {
      return 'URGENT_IMPORTANT';
    } else if (text.includes('urgent')) {
      return 'URGENT_NOT_IMPORTANT';
    } else if (text.includes('important')) {
      return 'NOT_URGENT_IMPORTANT';
    } else if (text.includes('not urgent') && text.includes('not important')) {
      return 'NOT_URGENT_NOT_IMPORTANT';
    }
    
    return 'NOT_URGENT_IMPORTANT';
  }
}

/**
 * MCP Server Implementation for Calendar Management
 */
class CalendarMCPServer implements CalendarMCPInterface {
  /**
   * Generate optimal schedule using AI
   */
  async generateSchedule(
    userId: string, 
    preferences: { workingHours?: { start: string; end: string }; focusTime?: boolean }
  ) {
    try {
      const userTasks = await taskQueries.getAll(userId);
      const userEvents = await calendarQueries.getAll(userId);
      
      const schedule = await generateOptimalSchedule(userTasks, userEvents, preferences);
      
      const newRecommendation = await aiRecommendationQueries.create(
        userId, 
        schedule, 
        JSON.stringify({ preferences, taskCount: userTasks.length, eventCount: userEvents.length })
      );
      
      revalidatePath('/ai-secretary');
      return { schedule, id: newRecommendation[0]?.id };
    } catch (error) {
      console.error('Error generating schedule:', error);
      throw new Error('Failed to generate schedule');
    }
  }
}

// Create singleton instances
const taskMCP = new TaskMCPServer();
const calendarMCP = new CalendarMCPServer();

/**
 * MCP Client Actions
 * These are the server actions that will be called from the client components
 */
export async function analyzeTasksAction(userId: string, input: string) {
  return taskMCP.analyzeTasks(userId, input);
}

export async function createTasksFromRecommendationAction(
  userId: string,
  recommendationId: number,
  recommendationText: string
) {
  return taskMCP.createTasksFromRecommendation(userId, recommendationId, recommendationText);
}

export async function generateScheduleAction(
  userId: string,
  preferences: { workingHours?: { start: string; end: string }; focusTime?: boolean }
) {
  return calendarMCP.generateSchedule(userId, preferences);
}

export async function getAIRecommendationsAction(userId: string) {
  try {
    if (!userId) return [];
    return await aiRecommendationQueries.getAll(userId);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return [];
  }
}

export async function markRecommendationAppliedAction(userId: string, recommendationId: number) {
  try {
    const updatedRecommendation = await aiRecommendationQueries.markApplied(userId, recommendationId);
    revalidatePath('/ai-secretary');
    return updatedRecommendation;
  } catch (error) {
    console.error('Error marking recommendation as applied:', error);
    throw new Error('Failed to mark recommendation as applied');
  }
}

// Export the MCP interfaces for type checking
export type { TaskMCPInterface, CalendarMCPInterface }; 