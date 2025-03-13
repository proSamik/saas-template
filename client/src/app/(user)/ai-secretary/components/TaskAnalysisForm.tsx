'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card' // Fixed import to only include Card
import { AIRecommendation } from '@/types/ai-secretary'
import { analyzeTasksAction } from '@/lib/user/actions/ai-actions'
import { Sparkles } from 'lucide-react'

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
  
  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userId || !input.trim()) return
    
    try {
      setLoading(true)
      
      // Call AI analysis action
      const result = await analyzeTasksAction(userId, input)
      
      if (result) {
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
        
        onAnalysisComplete(recommendation)
        setInput('')
      }
    } catch (error) {
      console.error('Error analyzing tasks:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Card>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-semibold">AI Task Analysis</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Describe your tasks and goals to get AI-powered recommendations for prioritization and scheduling
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Textarea
              placeholder="Describe your tasks, goals, and constraints. For example: 'I need to prepare a presentation for tomorrow, finish a report by Friday, and also want to exercise 3 times this week.'"
              className="min-h-[120px]"
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