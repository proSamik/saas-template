'use client'

import { UserAuthProvider } from '@/middleware/userAuth'
import { UserDataProvider } from '@/contexts/UserDataContext'

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <UserDataProvider>
      <UserAuthProvider>
        <div className="flex min-h-screen bg-light-background dark:bg-dark-background mt-10">
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </UserAuthProvider>
    </UserDataProvider>
  )
} 