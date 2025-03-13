'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card' // Fixed import to only include Card
import { AIRecommendation } from '@/types/ai-secretary'
import { analyzeTasksAction } from '@/lib/user/actions/ai-actions'
import { Sparkles, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

/**
 * Props for the TaskAnalysisForm component
 */
interface TaskAnalysisFormProps {
  userId?: string
  onAnalysisComplete: (recommendation: AIRecommendation) => void
}

/**
 * TaskAnalysisForm component for analyzing tasks with AI
 * Allows users to input task descriptions and get AI-powered recommendations
 */
export default function TaskAnalysisForm({ userId, onAnalysisComplete }: TaskAnalysisFormProps) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userId || !input.trim()) return
    
    // Reset error state
    setError(null)
    
    try {
      setLoading(true)
      
      // Call AI analysis action
      const result = await analyzeTasksAction(userId, input)
      
      if (result) {
        // Check if the result indicates an error
        if (result.error) {
          setError(result.recommendation)
          toast.error('Error analyzing tasks', {
            description: result.recommendation
          })
          return
        }
        
        // Create a recommendation object to match the AIRecommendation type
        const recommendation: AIRecommendation = {
          id: result.id,
          userId,
          recommendation: result.recommendation,
          context: input,
          isApplied: false,
          appliedAt: null,
          createdAt: new Date(),
          isDeleted: false,
        }
        
        // Only call onAnalysisComplete if we have a valid recommendation
        // that doesn't contain error messages
        if (!result.recommendation.includes('error') && 
            !result.recommendation.includes('failed') &&
            !result.recommendation.includes('unavailable')) {
          onAnalysisComplete(recommendation)
          setInput('')
          toast.success('Analysis complete', {
            description: 'Check the AI Recommendations tab to view your analysis'
          })
        } else {
          // Show the error message from the AI service
          setError(result.recommendation)
          toast.error('AI Service Issue', {
            description: result.recommendation
          })
        }
      }
    } catch (error) {
      console.error('Error analyzing tasks:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setError(errorMessage)
      toast.error('Failed to analyze tasks', {
        description: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Card>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold ">AI Task Analysis</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Describe your tasks and goals to get AI-powered recommendations for prioritization and scheduling
        </p>
        
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 mb-4 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-destructive">AI Analysis Error</p>
              <p className="text-sm text-destructive/90">{error}</p>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Textarea
              placeholder="Describe your tasks, goals, and constraints. For example: 'I need to prepare a presentation for tomorrow, finish a report by Friday, and also want to exercise 3 times this week.'"
              className="min-h-[120px] text-foreground bg-white dark:bg-transparent dark:text-white" // Added background white
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground max-w-[70%]">
              Uses AI to analyze your tasks and provide recommendations based on the Eisenhower Matrix and Pareto Principle
            </p>
            <Button type="submit" disabled={loading || !input.trim()}>
              {loading ? 'Analyzing...' : 'Analyze Tasks'}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  )
} 