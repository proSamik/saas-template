'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Navigation } from '@/components/Navigation'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/Button'
import {
  PlusIcon,
  TagIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline'

const projects = [
  {
    id: 1,
    name: 'Website Redesign',
    description: 'Redesign and implement the company website with modern technologies.',
    status: 'In Progress',
    dueDate: '2024-04-30',
  },
  {
    id: 2,
    name: 'Mobile App Development',
    description: 'Develop a cross-platform mobile application for our service.',
    status: 'Planning',
    dueDate: '2024-05-15',
  },
  // Add more sample projects as needed
]

/**
 * Projects page component that displays and manages user projects
 * Protected route that requires authentication
 */
export default function Projects() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isCreatingProject, setIsCreatingProject] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-light-background dark:bg-dark-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-light-muted dark:text-dark-muted">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background">
      <Navigation />

      <div className="flex">
        <Sidebar />

        {/* Main content */}
        <div className="flex flex-1 flex-col md:pl-64">
          <main className="flex-1">
            <div className="py-6">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-light-foreground dark:text-dark-foreground">
                  Projects
                </h1>
                <Button onClick={() => setIsCreatingProject(true)}>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  New Project
                </Button>
              </div>

              <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                {/* Project List */}
                <div className="mt-8 space-y-4">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="overflow-hidden rounded-lg bg-light-background dark:bg-dark-background border border-light-accent dark:border-dark-accent px-6 py-4 shadow hover:border-primary-600 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-light-foreground dark:text-dark-foreground">
                            {project.name}
                          </h3>
                          <p className="mt-1 text-sm text-light-muted dark:text-dark-muted">
                            {project.description}
                          </p>
                          <div className="mt-2 flex items-center space-x-4">
                            <span className="flex items-center text-sm text-light-muted dark:text-dark-muted">
                              <TagIcon className="h-4 w-4 mr-1" />
                              {project.status}
                            </span>
                            <span className="flex items-center text-sm text-light-muted dark:text-dark-muted">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              Due {new Date(project.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
} 