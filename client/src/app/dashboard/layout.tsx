'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/Navigation'
import { Sidebar } from '@/components/Sidebar'
import useAuthStore from '@/lib/store'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { accessToken, user } = useAuthStore()

  useEffect(() => {
    if (!accessToken) {
      router.push('/auth/login')
    }
  }, [accessToken, router])

  if (!accessToken || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-light-background dark:bg-dark-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-light-muted dark:text-dark-muted">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background">
      <Navigation />
      <div className="flex">
        <Sidebar />
        <div className="flex flex-1 flex-col md:pl-64">
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  )
}