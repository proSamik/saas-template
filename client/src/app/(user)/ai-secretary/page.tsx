'use client'

import { useEffect, useState } from 'react'
import { useUserData } from '@/contexts/UserDataContext'
import { useAuth } from '@/contexts/AuthContext'
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
import { toast } from 'sonner'
import { AlertCircle, RefreshCcw } from 'lucide-react'
import { Card } from '@/components/ui/card'

/**
 * AI Secretary Dashboard Page
 * Main entry point for the AI secretary application
 */
export default function AISecretaryPage() {
  const { userData } = useUserData()
  const { auth } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [loadingRecommendations, setLoadingRecommendations] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('tasks')
  
  // Get the user ID directly from auth context
  const userId = auth?.id

  // Add debug logging
  console.log('userData:', userData)
  console.log('auth:', auth)
  console.log('userId:', userId)
  console.log('loading state:', loading)

  // Load user data on initial render
  useEffect(() => {
    const loadUserData = async () => {
      console.log('loadUserData called with userId:', userId)
      
      if (userId) {
        try {
          setLoading(true)
          setError(null)
          console.log('Starting to fetch data...')
          
          // Fetch tasks and events, which are essential
          try {
            const [taskData, eventData] = await Promise.all([
              getTasks(userId).catch(e => {
                console.error('Error fetching tasks:', e)
                return []
              }),
              getCalendarEvents(userId).catch(e => {
                console.error('Error fetching events:', e)
                return []
              })
            ])
            
            console.log('Data fetched:', { taskData, eventData })
            setTasks(taskData)
            setEvents(eventData)
          } catch (dataError) {
            console.error('Error loading essential data:', dataError)
            toast.error('Failed to load tasks and events')
          }
          
          // Fetch recommendations separately so that failures don't block the UI
          setLoadingRecommendations(true)
          try {
            const recData = await getAIRecommendations(userId)
            console.log('Recommendations fetched:', { recData })
            setRecommendations(recData || [])
          } catch (recError) {
            console.error('Error loading recommendations:', recError)
            // Don't show a toast for this since it's not critical
          } finally {
            setLoadingRecommendations(false)
          }
        } catch (error) {
          console.error('Error loading user data:', error)
          setError('Failed to load data. Please try refreshing the page.')
        } finally {
          console.log('Setting loading to false')
          setLoading(false)
        }
      } else {
        // If no userId is available after a reasonable time, stop loading
        console.log('No userId available, stopping loading')
        setLoading(false)
        setLoadingRecommendations(false)
      }
    }
    
    loadUserData()
  }, [userId])

  /**
   * Retry loading recommendations if they failed
   */
  const retryLoadRecommendations = async () => {
    if (!userId) return
    
    setLoadingRecommendations(true)
    try {
      const recData = await getAIRecommendations(userId)
      setRecommendations(recData || [])
      toast.success('Successfully loaded recommendations')
    } catch (error) {
      console.error('Error reloading recommendations:', error)
      toast.error('Failed to load recommendations')
    } finally {
      setLoadingRecommendations(false)
    }
  }
  
  /**
   * Handle tasks created from AI recommendations
   * @param newTasks - The newly created tasks
   */
  const handleTasksCreatedFromRecommendation = (newTasks: Task[]) => {
    // Add the new tasks to the tasks state
    setTasks(prevTasks => [...newTasks, ...prevTasks])
    
    // Switch to the tasks tab to show the newly created tasks
    setActiveTab('tasks')
    
    // Show a toast notification
    toast.success(
      `${newTasks.length} ${newTasks.length === 1 ? 'task' : 'tasks'} created from AI recommendation`,
      {
        description: 'Check the Tasks tab to view and manage them'
      }
    )
  }
  
  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-4">AI Secretary</h1>
        <p>Loading your personalized dashboard...</p>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-4">AI Secretary</h1>
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold mb-2">Error Loading Data</h2>
              <p className="mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </Card>
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
      
      <Tabs 
        defaultValue="tasks" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
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
          {loadingRecommendations ? (
            <Card className="p-6 text-center">
              <p className="mb-2">Loading AI recommendations...</p>
            </Card>
          ) : recommendations.length === 0 ? (
            <Card className="p-6">
              <div className="flex flex-col items-center justify-center">
                <p className="mb-4">No recommendations found. This might be due to an error.</p>
                <button
                  onClick={retryLoadRecommendations}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Retry Loading Recommendations
                </button>
              </div>
            </Card>
          ) : (
            <AIRecommendationsList 
              recommendations={recommendations}
              userId={userId}
              onRecommendationMarkedApplied={(appliedRecId: number) => {
                setRecommendations(recommendations.map(r => 
                  r.id === appliedRecId ? {...r, isApplied: true, appliedAt: new Date()} : r
                ))
              }}
              onTasksCreated={handleTasksCreatedFromRecommendation}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 