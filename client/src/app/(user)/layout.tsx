'use client'

import { UserAuthProvider } from '@/middleware/userAuth'
import { UserDataProvider } from '@/contexts/UserDataContext'
import { useUserData } from '@/contexts/UserDataContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

function UserLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { userData, loading } = useUserData()

  useEffect(() => {
    if (!loading && !userData) {
      router.replace('/#pricing')
    }
  }, [userData, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen bg-light-background dark:bg-dark-background mt-10">
        <main className="flex-1 p-8">
          Loading...
        </main>
      </div>
    )
  }

  if (!userData) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-light-background dark:bg-dark-background mt-10">
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <UserDataProvider>
      <UserAuthProvider>
        <UserLayoutContent>
          {children}
        </UserLayoutContent>
      </UserAuthProvider>
    </UserDataProvider>
  )
} 