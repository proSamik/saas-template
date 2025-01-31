'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Navigation } from '@/components/Navigation'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import api from '@/lib/axios'
import toast from 'react-hot-toast'

/**
 * Settings page component that allows users to edit their profile
 * Protected route that requires authentication
 */
export default function Settings() {
  const { data: session, status, update: updateSession } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        name: session.user.name || '',
        email: session.user.email || '',
      }))
    }
  }, [status, router, session])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await api.put('/user/profile', {
        name: formData.name,
        email: formData.email,
      })

      await updateSession({
        ...session,
        user: {
          ...session?.user,
          name: formData.name,
          email: formData.email,
        },
      })

      toast.success('Profile updated successfully')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      await api.put('/user/password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      })

      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }))
      toast.success('Password updated successfully')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update password')
    } finally {
      setIsLoading(false)
    }
  }

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

        <div className="flex flex-1 flex-col md:pl-64">
          <main className="flex-1">
            <div className="py-6">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                <h1 className="text-2xl font-semibold text-light-foreground dark:text-dark-foreground">
                  Settings
                </h1>
              </div>

              <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                {/* Profile Settings */}
                <div className="mt-8">
                  <div className="bg-light-background dark:bg-dark-background border border-light-accent dark:border-dark-accent rounded-lg shadow">
                    <div className="p-6">
                      <h2 className="text-lg font-medium text-light-foreground dark:text-dark-foreground">
                        Profile Information
                      </h2>
                      <form onSubmit={handleProfileUpdate} className="mt-6 space-y-6">
                        <Input
                          label="Name"
                          id="name"
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleChange}
                          required
                        />
                        <Input
                          label="Email"
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                        <Button type="submit" isLoading={isLoading}>
                          Update Profile
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>

                {/* Password Settings */}
                <div className="mt-8">
                  <div className="bg-light-background dark:bg-dark-background border border-light-accent dark:border-dark-accent rounded-lg shadow">
                    <div className="p-6">
                      <h2 className="text-lg font-medium text-light-foreground dark:text-dark-foreground">
                        Change Password
                      </h2>
                      <form onSubmit={handlePasswordUpdate} className="mt-6 space-y-6">
                        <Input
                          label="Current Password"
                          id="currentPassword"
                          name="currentPassword"
                          type="password"
                          value={formData.currentPassword}
                          onChange={handleChange}
                          required
                        />
                        <Input
                          label="New Password"
                          id="newPassword"
                          name="newPassword"
                          type="password"
                          value={formData.newPassword}
                          onChange={handleChange}
                          required
                        />
                        <Input
                          label="Confirm New Password"
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                        />
                        <Button type="submit" isLoading={isLoading}>
                          Update Password
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
} 