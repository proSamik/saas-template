'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import React from 'react'

type Tab = 'profile' | 'settings'

export default function ProfileLayout({
  children,
  settings,
}: {
  children: React.ReactNode
  settings: React.ReactNode
}) {
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (status === 'unauthenticated') {
    router.push('/auth/login')
    return null
  }

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background flex justify-center">
      <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile Tabs */}
        <div className="sm:hidden mb-4 mt-16">
          <div className="flex space-x-2 bg-light-card dark:bg-dark-card rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'profile' ? 'bg-light-accent dark:bg-dark-accent dark:text-white' : 'text-light-foreground dark:text-dark-foreground'}`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'settings' ? 'bg-light-accent dark:bg-dark-accent dark:text-white' : 'text-light-foreground dark:text-dark-foreground'}`}
            >
              Settings
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar for larger screens */}
          <div className="hidden sm:block w-56 shrink-0">
            <div className="sticky top-24 bg-light-card dark:bg-dark-card rounded-lg shadow-sm p-3">
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-light-accent dark:bg-dark-accent dark:text-white' : 'hover:bg-light-hover dark:hover:bg-dark-hover text-light-foreground dark:text-dark-foreground'}`}
                >
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full text-left px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-light-accent dark:bg-dark-accent dark:text-white' : 'hover:bg-light-hover dark:hover:bg-dark-hover text-light-foreground dark:text-dark-foreground'}`}
                >
                  Settings
                </button>
              </nav>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1">
            <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-sm p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  {activeTab === 'profile' ? children : settings}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}