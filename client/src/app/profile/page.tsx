'use client'

import { useAuth } from '@/contexts/AuthContext'

export default function Profile() {
  const { auth } = useAuth()

  if (!auth) {
    return (
      <div className="min-h-screen bg-light-background dark:bg-dark-background">
        <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="text-center text-light-foreground dark:text-dark-foreground">
            Please log in to view your profile
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background">
      <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="text-center text-3xl font-bold tracking-tight text-light-foreground dark:text-dark-foreground">
            Profile
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-light-background dark:bg-dark-background px-4 py-8 shadow sm:rounded-lg sm:px-10">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-light-foreground dark:text-dark-foreground">
                  Name
                </label>
                <div className="mt-1">
                  <p className="text-light-muted dark:text-dark-muted">{auth.name}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-light-foreground dark:text-dark-foreground">
                  Email
                </label>
                <div className="mt-1">
                  <p className="text-light-muted dark:text-dark-muted">{auth.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}