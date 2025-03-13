import OpenAI from 'openai';

/**
 * OpenRouter API client configuration
 * Uses the OpenAI-compatible SDK
 */
const openRouter = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '',
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://saas-app.com', // Replace with your actual site
    'X-Title': 'AI Secretary',
  },
  dangerouslyAllowBrowser: true,
});

/**
 * Enhanced task analysis with AI
 * @param input - The text input describing tasks or requesting analysis
 * @returns AI-generated response with analysis and recommendations
 */
export async function analyzeTasksWithAI(input: string): Promise<string> {
  const systemPrompt = `
You are an AI assistant specialized in task management and productivity optimization.
Your role is to help users apply:
1. The Pareto Principle (80/20 rule): Focus on the 20% of tasks that yield 80% of results.
2. The Eisenhower Matrix: Categorize tasks into four quadrants (Urgent & Important, Important Not Urgent, Urgent Not Important, Not Urgent & Not Important).

IMPORTANT: Format your response in the following structure:

### Task Analysis
[Brief analysis of the current situation]

### High-Impact Tasks (80/20)
[List the 20% of tasks that will yield 80% of results]

### Task Categorization
1. Urgent & Important:
   - Task 1: [Description]
   - Task 2: [Description]

2. Important Not Urgent:
   - Task 1: [Description]
   - Task 2: [Description]

3. Urgent Not Important:
   - Task 1: [Description]
   - Task 2: [Description]

4. Not Urgent & Not Important:
   - Task 1: [Description]
   - Task 2: [Description]

### Actionable Recommendations
[Numbered list of specific actions]

### Time Blocking
[Suggested time blocks for tasks]

Be concise, practical, and focus on helping the user maximize their productivity.
`;

  // Check if API key is available
  if (!process.env.NEXT_PUBLIC_OPENROUTER_API_KEY) {
    console.error('OpenRouter API key is missing');
    return 'AI analysis is not available at this time. Please check your API configuration.';
  }

  try {
    console.log('Sending request to OpenRouter API...');
    
    const completion = await openRouter.chat.completions.create({
      model: 'openai/gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: input }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      presence_penalty: 0.6,
      frequency_penalty: 0.6,
    });

    if (!completion.choices || completion.choices.length === 0) {
      console.error('No completion choices returned from OpenRouter');
      return 'The AI analysis service returned an empty response. Please try again later.';
    }

    const response = completion.choices[0]?.message.content;
    if (!response) {
      return 'No analysis could be generated.';
    }

    const formattedResponse = response.trim();
    if (formattedResponse.length < 50) {
      return 'The AI response was too short. Please try again with more detailed input.';
    }

    return formattedResponse;
  } catch (error) {
    console.error('Error in AI task analysis:', error);
    
    if (error instanceof Error) {
      const errorMessage = error.message;
      
      if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
        return 'AI analysis failed due to API authentication issues. Please check your API key configuration.';
      }
      
      if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        return 'AI analysis is temporarily unavailable due to rate limits. Please try again in a few minutes.';
      }
      
      if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
        return 'AI analysis failed due to network issues. Please check your internet connection and try again.';
      }

      if (errorMessage.includes('context_length')) {
        return 'The input text is too long. Please try with a shorter input.';
      }
    }
    
    return 'An error occurred while analyzing your tasks. Please try again later.';
  }
}

/**
 * Generate an optimized schedule based on tasks
 * @param tasks - Array of task objects
 * @param existingEvents - Existing calendar events to consider
 * @param preferences - User scheduling preferences
 * @returns AI-generated scheduling recommendations
 */
export async function generateOptimalSchedule(
  tasks: any[], 
  existingEvents: any[],
  preferences: { workingHours?: { start: string; end: string }; focusTime?: boolean }
): Promise<string> {
  // Format tasks and events for the AI
  const tasksFormatted = tasks.map(t => 
    `Task: ${t.title}\nPriority: ${t.priority}\nEstimated time: ${t.estimatedTimeMinutes} minutes\nDue date: ${t.dueDate}\n`
  ).join('\n');
  
  const eventsFormatted = existingEvents.map(e => 
    `Event: ${e.title}\nFrom: ${e.startTime}\nTo: ${e.endTime}\n`
  ).join('\n');

  const workingHours = preferences.workingHours ? 
    `Working hours: ${preferences.workingHours.start} to ${preferences.workingHours.end}` : 
    'Standard 9-5 working hours';
  
  const focusPreference = preferences.focusTime ? 
    'User prefers focused time blocks of at least 90 minutes' : 
    'No specific focus time requirements';

  const prompt = `
I need help creating an optimal schedule based on my tasks and existing commitments.

My current tasks:
${tasksFormatted}

My existing calendar events:
${eventsFormatted}

My preferences:
${workingHours}
${focusPreference}

Please help me create an optimal schedule for these tasks that:
1. Applies the Pareto Principle to focus on high-impact tasks
2. Uses the Eisenhower Matrix for prioritization
3. Blocks time efficiently on my calendar
4. Respects my existing commitments
5. Provides specific time slots for each task
`;

  try {
    const completion = await openRouter.chat.completions.create({
      model: 'openai/gpt-4-turbo',
      messages: [
        { role: 'system', content: 'You are an AI secretary specialized in optimal scheduling and time management.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    return completion.choices[0]?.message.content || 'No schedule could be generated.';
  } catch (error) {
    console.error('Error in AI schedule generation:', error);
    return 'An error occurred while generating your schedule. Please try again later.';
  }
} 