'use client'

import { useAuth } from '@/contexts/AuthContext'
import ProfileLayout from '@/components/profile/ProfileLayout'
import Settings from '@/components/profile/Settings'
import Subscription from '@/components/profile/Subscription'
import Orders from '@/components/profile/Orders'

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

  const ProfileContent = () => (
    <div className="space-y-6 p-4">
      <h3 className="text-2xl font-semibold text-light-foreground dark:text-dark-foreground">
        Profile
      </h3>

      <div className="rounded-lg bg-light-card dark:bg-dark-card p-6 shadow-sm">
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
  )

  return (
    <ProfileLayout
      settings={<Settings />}
      subscription={<Subscription />}
      orders={<Orders />}
    >
      <ProfileContent />
    </ProfileLayout>
  )
}