'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog'
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { updateTask } from '@/lib/user/actions/task-actions'
import { Task } from '@/types/ai-secretary'
import { priorityEnum } from '@/lib/user/db/schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Checkbox } from '@/components/ui/checkbox'

/**
 * Props for the EditTaskForm component
 */
interface EditTaskFormProps {
  task: Task
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskUpdated: (task: Task) => void
}

/**
 * Form validation schema
 */
const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(priorityEnum.enumValues),
  dueDate: z.date().optional(),
  estimatedTimeMinutes: z.number().int().positive().optional(),
  actualTimeMinutes: z.number().int().positive().optional(),
  isCompleted: z.boolean().default(false),
})

/**
 * Type for form values
 */
type FormValues = {
  title: string;
  description?: string;
  priority: typeof priorityEnum.enumValues[number];
  dueDate?: Date;
  estimatedTimeMinutes?: number;
  actualTimeMinutes?: number;
  isCompleted: boolean;
}

/**
 * EditTaskForm component for editing existing tasks
 * Uses a dialog to display the form
 */
export default function EditTaskForm({ task, userId, open, onOpenChange, onTaskUpdated }: EditTaskFormProps) {
  const [loading, setLoading] = useState(false)
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: task.title,
      description: task.description || '',
      priority: task.priority as FormValues['priority'],
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      estimatedTimeMinutes: task.estimatedTimeMinutes || undefined,
      actualTimeMinutes: task.actualTimeMinutes || undefined,
      isCompleted: task.isCompleted || false,
    },
  })
  
  // Reset form when task changes
  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description || '',
        priority: task.priority as FormValues['priority'],
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        estimatedTimeMinutes: task.estimatedTimeMinutes || undefined,
        actualTimeMinutes: task.actualTimeMinutes || undefined,
        isCompleted: task.isCompleted || false,
      })
    }
  }, [form, task])
  
  /**
   * Handle form submission
   */
  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true)
      
      // Create FormData object for server action
      const formData = new FormData()
      formData.append('title', values.title as string)
      if (values.description) formData.append('description', values.description as string)
      formData.append('priority', values.priority as string)
      if (values.dueDate) formData.append('dueDate', values.dueDate.toISOString())
      if (values.estimatedTimeMinutes) {
        formData.append('estimatedTimeMinutes', values.estimatedTimeMinutes.toString())
      }
      if (values.actualTimeMinutes) {
        formData.append('actualTimeMinutes', values.actualTimeMinutes.toString())
      }
      formData.append('isCompleted', values.isCompleted ? 'true' : 'false')
      
      // Call server action
      const result = await updateTask(userId, task.id, formData)
      
      if (result && result[0]) {
        onTaskUpdated(result[0])
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Error updating task:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Task title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Task description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Priority */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="URGENT_IMPORTANT">Urgent & Important (Do First)</SelectItem>
                      <SelectItem value="NOT_URGENT_IMPORTANT">Important (Schedule)</SelectItem>
                      <SelectItem value="URGENT_NOT_IMPORTANT">Urgent (Delegate)</SelectItem>
                      <SelectItem value="NOT_URGENT_NOT_IMPORTANT">Low Priority (Eliminate)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Due Date */}
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }: { field: any }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    className="rounded-md border"
                    initialFocus
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Estimated Time */}
            <FormField
              control={form.control}
              name="estimatedTimeMinutes"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Estimated Time (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Estimated time in minutes"
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Actual Time */}
            <FormField
              control={form.control}
              name="actualTimeMinutes"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Actual Time (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Actual time spent in minutes"
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Is Completed */}
            <FormField
              control={form.control}
              name="isCompleted"
              render={({ field }: { field: any }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Mark as completed</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Check if this task is completed
                    </p>
                  </div>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 