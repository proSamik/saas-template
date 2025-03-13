'use client'

import { Task } from '@/types/ai-secretary'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle, 
  Clock, 
  Calendar, 
  MoreVertical, 
  Pencil, 
  Trash
} from 'lucide-react'
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'


/**
 * Props for the TaskItem component
 */
interface TaskItemProps {
  task: Task
  onComplete?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

/**
 * TaskItem component for displaying individual tasks
 * Includes task details, completion status, and action buttons
 */
export default function TaskItem({ task, onComplete, onEdit, onDelete }: TaskItemProps) {
  // Format date for display
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'No date'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }
  
  // Priority styling
  const priorityStyles = {
    'URGENT_IMPORTANT': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    'NOT_URGENT_IMPORTANT': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    'URGENT_NOT_IMPORTANT': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
    'NOT_URGENT_NOT_IMPORTANT': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  }
  
  // Priority labels for display
  const priorityLabels = {
    'URGENT_IMPORTANT': 'Urgent & Important',
    'NOT_URGENT_IMPORTANT': 'Important',
    'URGENT_NOT_IMPORTANT': 'Urgent',
    'NOT_URGENT_NOT_IMPORTANT': 'Low Priority',
  }
  
  return (
    <div className={`p-4 rounded-lg border ${task.isCompleted ? 'bg-gray-50 dark:bg-gray-900/50' : 'bg-white dark:bg-gray-950'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className={`font-medium ${task.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${priorityStyles[task.priority as keyof typeof priorityStyles]}`}>
              {priorityLabels[task.priority as keyof typeof priorityLabels]}
            </span>
          </div>
          
          {task.description && (
            <HoverCard>
              <HoverCardTrigger asChild>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1 cursor-help">
                  {task.description}
                </p>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-medium">Description</h4>
                  <p className="text-sm">{task.description}</p>
                </div>
              </HoverCardContent>
            </HoverCard>
          )}
          
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            {task.dueDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Due: {formatDate(task.dueDate)}</span>
              </div>
            )}
            
            {task.estimatedTimeMinutes && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Est: {task.estimatedTimeMinutes} min</span>
              </div>
            )}
            
            {task.completedAt && (
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                <span>Completed: {formatDate(task.completedAt)}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!task.isCompleted && onComplete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onComplete}
              title="Mark as complete"
            >
              <CheckCircle className="h-4 w-4" />
              <span className="sr-only">Complete</span>
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
} 