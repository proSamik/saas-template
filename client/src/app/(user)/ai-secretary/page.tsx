'use client'

import { useEffect, useState } from 'react'
import { useUserData } from '@/contexts/UserDataContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getTasks } from '@/lib/user/actions/task-actions'
import { getCalendarEvents } from '@/lib/user/actions/calendar-actions'
import { getAIRecommendations } from '@/lib/user/actions/ai-actions'
import { Task, CalendarEvent, AIRecommendation } from '@/types/ai-secretary'
import TaskBoard from './components/TaskBoard'
import CalendarView from './components/CalendarView'
import AIRecommendationsList from './components/AIRecommendationsList'
import TaskAnalysisForm from './components/TaskAnalysisForm'
import CreateTaskForm from './components/CreateTaskForm'
import CreateEventForm from './components/CreateEventForm'

// Define the Auth type from the AuthContext
interface AuthState {
  id: string
  name: string
  email: string
  email_verified: boolean
}

/**
 * AI Secretary Dashboard Page
 * Main entry point for the AI secretary application
 */
export default function AISecretaryPage() {
  const { userData } = useUserData()
  const [tasks, setTasks] = useState<Task[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  
  // Get the user ID from auth context
  const userId = (userData as any)?.auth?.id

  // Add debug logging
  console.log('userData:', userData)
  console.log('userId:', userId)
  console.log('loading state:', loading)

  // Load user data on initial render
  useEffect(() => {
    const loadUserData = async () => {
      console.log('loadUserData called with userId:', userId)
      
      if (userId) {
        try {
          setLoading(true)
          console.log('Starting to fetch data...')
          
          // Fetch tasks, events, and recommendations in parallel
          const [taskData, eventData, recData] = await Promise.all([
            getTasks(userId).catch(e => {
              console.error('Error fetching tasks:', e)
              return []
            }),
            getCalendarEvents(userId).catch(e => {
              console.error('Error fetching events:', e)
              return []
            }),
            getAIRecommendations(userId).catch(e => {
              console.error('Error fetching recommendations:', e)
              return []
            })
          ])
          
          console.log('Data fetched:', { taskData, eventData, recData })
          
          setTasks(taskData)
          setEvents(eventData)
          setRecommendations(recData)
        } catch (error) {
          console.error('Error loading user data:', error)
        } finally {
          console.log('Setting loading to false')
          setLoading(false)
        }
      } else {
        // If no userId is available after a reasonable time, stop loading
        console.log('No userId available, stopping loading')
        setLoading(false)
      }
    }
    
    loadUserData()
  }, [userId])
  
  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-4">AI Secretary</h1>
        <p>Loading your personalized dashboard...</p>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">AI Secretary</h1>
        <div className="flex gap-4">
          <CreateTaskForm 
            userId={userId} 
            onTaskCreated={(newTask: Task) => setTasks([newTask, ...tasks])} 
          />
          <CreateEventForm 
            userId={userId} 
            tasks={tasks} 
            onEventCreated={(newEvent: CalendarEvent) => setEvents([newEvent, ...events])} 
          />
        </div>
      </div>
      
      <div className="mb-8">
        <TaskAnalysisForm 
          userId={userId} 
          onAnalysisComplete={(newRec: AIRecommendation) => setRecommendations([newRec, ...recommendations])} 
        />
      </div>
      
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tasks" className="space-y-4">
          <TaskBoard 
            tasks={tasks} 
            userId={userId}
            onTaskUpdated={(updatedTask: Task) => {
              setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t))
            }}
            onTaskDeleted={(deletedTaskId: number) => {
              setTasks(tasks.filter(t => t.id !== deletedTaskId))
            }}
          />
        </TabsContent>
        
        <TabsContent value="calendar" className="space-y-4">
          <CalendarView 
            events={events} 
            tasks={tasks}
            userId={userId}
            onEventUpdated={(updatedEvent: CalendarEvent) => {
              setEvents(events.map(e => e.id === updatedEvent.id ? updatedEvent : e))
            }}
            onEventDeleted={(deletedEventId: number) => {
              setEvents(events.filter(e => e.id !== deletedEventId))
            }}
          />
        </TabsContent>
        
        <TabsContent value="recommendations" className="space-y-4">
          <AIRecommendationsList 
            recommendations={recommendations}
            userId={userId}
            onRecommendationMarkedApplied={(appliedRecId: number) => {
              setRecommendations(recommendations.map(r => 
                r.id === appliedRecId ? {...r, isApplied: true, appliedAt: new Date()} : r
              ))
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
} 