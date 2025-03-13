'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card' // Removed unused imports
import { AIRecommendation, Task } from '@/types/ai-secretary'
import { markRecommendationApplied, createTasksFromRecommendation } from '@/lib/user/actions/ai-actions'
import { CheckCircle, Clock, Sparkles, Plus, ListTodo } from 'lucide-react'
import { toast } from 'sonner'

/**
 * Props for the AIRecommendationsList component
 */
interface AIRecommendationsListProps {
  recommendations: AIRecommendation[]
  userId?: string
  onRecommendationMarkedApplied: (recommendationId: number) => void
  onTasksCreated?: (tasks: Task[]) => void
}

/**
 * AIRecommendationsList component for displaying AI-generated recommendations
 */
export default function AIRecommendationsList({ 
  recommendations, 
  userId, 
  onRecommendationMarkedApplied,
  onTasksCreated 
}: AIRecommendationsListProps) {
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const [creatingTasksId, setCreatingTasksId] = useState<number | null>(null)
  
  /**
   * Format date for display
   * @param date - The date to format
   * @returns Formatted date string
   */
  const formatDate = (date: Date | null) => {
    if (!date) return 'Unknown date'
    
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }
  
  /**
   * Handle marking a recommendation as applied
   * @param recommendationId - The ID of the recommendation to mark as applied
   */
  const handleMarkApplied = async (recommendationId: number) => {
    if (!userId) return
    
    try {
      setLoadingId(recommendationId)
      await markRecommendationApplied(userId, recommendationId)
      onRecommendationMarkedApplied(recommendationId)
      toast.success('Recommendation marked as applied')
    } catch (error) {
      console.error('Error marking recommendation as applied:', error)
      toast.error('Failed to mark recommendation as applied')
    } finally {
      setLoadingId(null)
    }
  }
  
  /**
   * Handle creating tasks from a recommendation
   * @param recommendation - The recommendation to create tasks from
   */
  const handleCreateTasks = async (recommendation: AIRecommendation) => {
    if (!userId) return
    
    try {
      setCreatingTasksId(recommendation.id)
      const tasks = await createTasksFromRecommendation(
        userId, 
        recommendation.id, 
        recommendation.recommendation
      )
      
      // Update UI to show recommendation as applied
      onRecommendationMarkedApplied(recommendation.id)
      
      // Notify parent component about new tasks
      if (onTasksCreated && tasks.length > 0) {
        onTasksCreated(tasks)
      }
      
      // Show success message
      toast.success(`Created ${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'} from recommendation`)
    } catch (error) {
      console.error('Error creating tasks from recommendation:', error)
      toast.error('Failed to create tasks from recommendation')
    } finally {
      setCreatingTasksId(null)
    }
  }
  
  if (recommendations.length === 0) {
    return (
      <Card className="border-dashed">
        <div className="flex flex-col items-center justify-center p-4">
          <h2 className="text-lg font-semibold">No AI Recommendations Yet</h2>
          <p className="text-sm text-gray-500">
            Use the AI Task Analysis tool to get personalized recommendations for your tasks
          </p>
        </div>
      </Card>
    )
  }
  
  return (
    <div className="space-y-6">
      {recommendations.map((recommendation) => (
        <Card key={recommendation.id} className={recommendation.isApplied ? 'bg-gray-50 dark:bg-gray-900/50' : ''}>
          <div className="flex justify-between items-start p-4">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Sparkles className="h-5 w-5 text-blue-500" />
                AI Recommendation
              </h3>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                <Clock className="h-3 w-3" />
                {formatDate(recommendation.createdAt)}
                {recommendation.isApplied && (
                  <>
                    <span className="mx-1">•</span>
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span className="text-green-600 dark:text-green-400">Applied</span>
                  </>
                )}
              </div>
            </div>
            {!recommendation.isApplied && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex gap-1 items-center"
                  onClick={() => handleCreateTasks(recommendation)}
                  disabled={creatingTasksId === recommendation.id || loadingId === recommendation.id}
                >
                  <ListTodo className="h-4 w-4" />
                  {creatingTasksId === recommendation.id ? 'Creating tasks...' : 'Create Tasks'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkApplied(recommendation.id)}
                  disabled={loadingId === recommendation.id || creatingTasksId === recommendation.id}
                >
                  {loadingId === recommendation.id ? 'Marking...' : 'Mark as Applied'}
                </Button>
              </div>
            )}
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none p-4">
            {recommendation.recommendation.split('\n').map((paragraph: string, index: number) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          {recommendation.context && (
            <div className="text-sm text-muted-foreground border-t pt-4 p-4">
              <strong>Based on:</strong> {recommendation.context}
            </div>
          )}
        </Card>
      ))}
    </div>
  )
} 