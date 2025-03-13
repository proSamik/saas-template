'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
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
import { PlusCircle } from 'lucide-react'
import { createTask } from '@/lib/user/actions/task-actions'
import { Task } from '@/types/ai-secretary'
import { priorityEnum } from '@/lib/user/db/schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

/**
 * Props for the CreateTaskForm component
 */
interface CreateTaskFormProps {
  userId?: string
  onTaskCreated: (task: Task) => void
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
}

/**
 * CreateTaskForm component for adding new tasks
 * Uses a dialog to display the form
 */
export default function CreateTaskForm({ userId, onTaskCreated }: CreateTaskFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'NOT_URGENT_IMPORTANT',
      estimatedTimeMinutes: undefined,
    },
  })
  
  /**
   * Handle form submission
   */
  const onSubmit = async (values: FormValues) => {
    if (!userId) return
    
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
      
      // Call server action
      const result = await createTask(userId, formData)
      
      if (result && result[0]) {
        onTaskCreated(result[0])
        setOpen(false)
        form.reset()
      }
    } catch (error) {
      console.error('Error creating task:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
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
            
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 