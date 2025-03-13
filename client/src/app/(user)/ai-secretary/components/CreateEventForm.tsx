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

import { CalendarPlus } from 'lucide-react'
import { createCalendarEvent } from '@/lib/user/actions/calendar-actions'
import { Task, CalendarEvent } from '@/types/ai-secretary'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Checkbox } from '@/components/ui/checkbox'

/**
 * Props for the CreateEventForm component
 */
interface CreateEventFormProps {
  userId?: string
  tasks: Task[]
  onEventCreated: (event: CalendarEvent) => void
}

/**
 * Form validation schema
 */
const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  taskId: z.string().optional(),
  isAllDay: z.boolean().default(false),
}).refine(data => {
  if (!data.startTime || !data.endTime) return true
  return new Date(data.endTime) > new Date(data.startTime)
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
})

/**
 * Type for form values
 */
type FormValues = {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  taskId?: string;
  isAllDay: boolean;
}

/**
 * CreateEventForm component for adding new calendar events
 * Uses a dialog to display the form
 */
export default function CreateEventForm({ userId, tasks, onEventCreated }: CreateEventFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      taskId: 'none',
      isAllDay: false,
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
      formData.append('startTime', values.startTime as string)
      formData.append('endTime', values.endTime as string)
      if (values.taskId && values.taskId !== 'none') formData.append('taskId', values.taskId as string)
      formData.append('isAllDay', values.isAllDay ? 'true' : 'false')
      
      // Call server action
      const result = await createCalendarEvent(userId, formData)
      
      if (result && result[0]) {
        onEventCreated(result[0])
        setOpen(false)
        form.reset()
      }
    } catch (error) {
      console.error('Error creating event:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Get incomplete tasks for the dropdown
  const incompleteTasks = tasks.filter(task => !task.isCompleted)
  
  return (
    <Dialog open={open} onOpenChange={setOpen} >
      <DialogTrigger asChild>
        <Button variant="outline">
          <CalendarPlus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-white dark:bg-background dark:text-white">
        <DialogHeader>
          <DialogTitle className='text-black dark:text-white'>Create Calendar Event</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel className='text-black dark:text-white'>Title</FormLabel>
                  <FormControl className="bg-white text-black dark:bg-transparent dark:text-white">
                    <Input placeholder="Event title" className="placeholder:text-gray-400 placeholder:italic" {...field} />
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
                  <FormLabel className='text-black dark:text-white'>Description</FormLabel>
                  <FormControl className="bg-white text-black dark:bg-transparent dark:text-white">
                    <Textarea placeholder="Event description" className="placeholder:text-gray-400 placeholder:italic" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Is All Day */}
            <FormField
              control={form.control}
              name="isAllDay"
              render={({ field }: { field: any }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className='text-black dark:text-white'>All day event</FormLabel>
                    <p className="text-sm text-black dark:text-white">
                      Check if this event lasts all day
                    </p>
                  </div>
                </FormItem>
              )}
            />
            
            {/* Start Time */}
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel className='text-black dark:text-white'>Start Time</FormLabel>
                  <FormControl className="bg-white text-black dark:bg-transparent dark:text-white">
                    <Input 
                      type="datetime-local" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* End Time */}
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel className='text-black dark:text-white'>End Time</FormLabel>
                  <FormControl className="bg-white text-black dark:bg-transparent dark:text-white">
                    <Input 
                      type="datetime-local" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Associated Task */}
            <FormField
              control={form.control}
              name="taskId"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel className='text-black dark:text-white'>Associated Task (Optional)</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                  >
                    <FormControl className="bg-white text-black dark:bg-transparent dark:text-white">
                      <SelectTrigger>
                        <SelectValue placeholder="Select a task (optional)" className="text-gray-400 italic" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {incompleteTasks.map(task => (
                        <SelectItem key={task.id} value={task.id.toString()}>
                          {task.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button" className='text-black dark:text-white'>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={loading} className='text-black dark:text-white'>
                {loading ? 'Creating...' : 'Create Event'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 