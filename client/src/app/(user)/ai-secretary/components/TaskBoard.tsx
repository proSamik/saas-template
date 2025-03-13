'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Task, Priority } from '@/types/ai-secretary'
import { completeTask, deleteTask } from '@/lib/user/actions/task-actions'
import TaskItem from '@/app/(user)/ai-secretary/components/TaskItem'
import EditTaskForm from '@/app/(user)/ai-secretary/components/EditTaskForm'

/**
 * Props for the TaskBoard component
 */
interface TaskBoardProps {
  tasks: Task[]
  userId?: string
  onTaskUpdated: (task: Task) => void
  onTaskDeleted: (taskId: number) => void
}

/**
 * TaskBoard component that displays tasks in the Eisenhower Matrix format
 * Tasks are categorized into four quadrants based on their priority
 */
export default function TaskBoard({ tasks, userId, onTaskUpdated, onTaskDeleted }: TaskBoardProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  
  /**
   * Handle task completion
   * @param taskId - The ID of the task to mark as complete
   */
  const handleCompleteTask = async (taskId: number) => {
    if (!userId) return
    
    try {
      const updated = await completeTask(userId, taskId)
      if (updated[0]) {
        onTaskUpdated(updated[0])
      }
    } catch (error) {
      console.error('Error completing task:', error)
    }
  }
  
  /**
   * Handle task deletion
   * @param taskId - The ID of the task to delete
   */
  const handleDeleteTask = async (taskId: number) => {
    if (!userId) return
    
    try {
      await deleteTask(userId, taskId)
      onTaskDeleted(taskId)
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }
  
  // Group tasks by priority quadrant
  const tasksByPriority = {
    'URGENT_IMPORTANT': tasks.filter(task => task.priority === 'URGENT_IMPORTANT' && !task.isCompleted),
    'NOT_URGENT_IMPORTANT': tasks.filter(task => task.priority === 'NOT_URGENT_IMPORTANT' && !task.isCompleted),
    'URGENT_NOT_IMPORTANT': tasks.filter(task => task.priority === 'URGENT_NOT_IMPORTANT' && !task.isCompleted),
    'NOT_URGENT_NOT_IMPORTANT': tasks.filter(task => task.priority === 'NOT_URGENT_NOT_IMPORTANT' && !task.isCompleted),
  }
  
  // Completed tasks
  const completedTasks = tasks.filter(task => task.isCompleted)
  
  /**
   * Renders a quadrant card with its tasks
   * @param title - The title of the quadrant
   * @param description - The description of the quadrant
   * @param priority - The priority type of the quadrant
   * @param tasks - The tasks to display in this quadrant
   * @returns JSX element for the quadrant card
   */
  const renderQuadrant = (title: string, description: string, priority: Priority, tasks: Task[]) => (
    <Card className="h-full">
      <div className="p-4 pb-2">
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="p-4">
        <div className="space-y-4">
          {tasks.length > 0 ? (
            tasks.map(task => (
              <TaskItem 
                key={task.id} 
                task={task} 
                onComplete={() => handleCompleteTask(task.id)}
                onEdit={() => setEditingTask(task)}
                onDelete={() => handleDeleteTask(task.id)}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No tasks in this quadrant</p>
          )}
        </div>
      </div>
    </Card>
  )
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quadrant I: Urgent & Important */}
        {renderQuadrant(
          'Do First', 
          'Urgent and important tasks', 
          'URGENT_IMPORTANT', 
          tasksByPriority.URGENT_IMPORTANT
        )}
        
        {/* Quadrant II: Not Urgent & Important */}
        {renderQuadrant(
          'Schedule', 
          'Important but not urgent tasks', 
          'NOT_URGENT_IMPORTANT', 
          tasksByPriority.NOT_URGENT_IMPORTANT
        )}
        
        {/* Quadrant III: Urgent & Not Important */}
        {renderQuadrant(
          'Delegate', 
          'Urgent but not important tasks', 
          'URGENT_NOT_IMPORTANT', 
          tasksByPriority.URGENT_NOT_IMPORTANT
        )}
        
        {/* Quadrant IV: Not Urgent & Not Important */}
        {renderQuadrant(
          'Eliminate', 
          'Neither urgent nor important tasks', 
          'NOT_URGENT_NOT_IMPORTANT', 
          tasksByPriority.NOT_URGENT_NOT_IMPORTANT
        )}
      </div>
      
      {/* Completed Tasks */}
      <Card>
        <div className="p-4 pb-2">
          <h3 className="text-lg font-medium">Completed Tasks</h3>
          <p className="text-sm text-muted-foreground">Tasks you have finished</p>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            {completedTasks.length > 0 ? (
              completedTasks.map(task => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  onEdit={() => setEditingTask(task)}
                  onDelete={() => handleDeleteTask(task.id)}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No completed tasks yet</p>
            )}
          </div>
        </div>
      </Card>
      
      {/* Edit Task Modal */}
      {editingTask && userId && (
        <EditTaskForm 
          task={editingTask}
          userId={userId}
          open={!!editingTask}
          onOpenChange={() => setEditingTask(null)}
          onTaskUpdated={onTaskUpdated}
        />
      )}
    </div>
  )
} 