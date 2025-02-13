'use client'

import { useState, useEffect, memo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ProfileLayout from '@/components/profile/ProfileLayout'
import Settings from '@/components/profile/Settings'
import Subscription from '@/components/profile/Subscription'
import Orders from '@/components/profile/Orders'
import { authService } from '@/services/auth'

const EditForm = memo(({ 
  formData, 
  onSubmit, 
  onChange, 
  onCancel, 
  isLoading 
}: {
  formData: { name: string; email: string }
  onSubmit: (e: React.FormEvent) => Promise<void>
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onCancel: () => void
  isLoading: boolean
}) => (
  <form onSubmit={onSubmit} className="space-y-6">
    <div>
      <label htmlFor="name" className="block text-sm font-medium text-light-foreground dark:text-dark-foreground">
        Name
      </label>
      <input
        id="name"
        name="name"
        type="text"
        value={formData.name}
        onChange={onChange}
        className="mt-1 block w-full rounded-md border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background px-3 py-2 text-light-foreground dark:text-dark-foreground shadow-sm focus:border-light-accent dark:focus:border-dark-accent focus:outline-none focus:ring-1 focus:ring-light-accent dark:focus:ring-dark-accent"
        required
      />
    </div>

    <div>
      <label htmlFor="email" className="block text-sm font-medium text-light-foreground dark:text-dark-foreground">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        value={formData.email}
        onChange={onChange}
        className="mt-1 block w-full rounded-md border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background px-3 py-2 text-light-foreground dark:text-dark-foreground shadow-sm focus:border-light-accent dark:focus:border-dark-accent focus:outline-none focus:ring-1 focus:ring-light-accent dark:focus:ring-dark-accent"
        required
      />
    </div>

    <div className="flex justify-end space-x-3">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 text-sm font-medium text-light-foreground dark:text-dark-foreground bg-light-background dark:bg-dark-background border border-light-border dark:border-dark-border rounded-md hover:bg-light-hover dark:hover:bg-dark-hover transition-colors"
        disabled={isLoading}
      >
        Cancel
      </button>
      <button
        type="submit"
        className="px-4 py-2 text-sm font-medium text-white bg-light-accent dark:bg-dark-accent rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
        disabled={isLoading}
      >
        {isLoading ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  </form>
))

EditForm.displayName = 'EditForm'

const ProfileContent = memo(({ 
  auth, 
  isEditing, 
  formData, 
  error, 
  isLoading,
  onEdit,
  onSubmit,
  onChange,
  onCancel
}: {
  auth: any
  isEditing: boolean
  formData: { name: string; email: string }
  error: string
  isLoading: boolean
  onEdit: () => void
  onSubmit: (e: React.FormEvent) => Promise<void>
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onCancel: () => void
}) => (
  <div className="space-y-6 p-4">
    <div className="flex justify-between items-center">
      <h3 className="text-2xl font-semibold text-light-foreground dark:text-dark-foreground">
        Profile
      </h3>
      {!isEditing && (
        <button
          onClick={onEdit}
          className="px-4 py-2 text-sm font-medium text-white bg-light-accent dark:bg-dark-accent rounded-md hover:opacity-90 transition-opacity"
        >
          Edit Profile
        </button>
      )}
    </div>

    {error && (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        {error}
      </div>
    )}

    <div className="rounded-lg bg-light-card dark:bg-dark-card p-6 shadow-sm">
      {isEditing ? (
        <EditForm
          formData={formData}
          onSubmit={onSubmit}
          onChange={onChange}
          onCancel={onCancel}
          isLoading={isLoading}
        />
      ) : (
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
      )}
    </div>
  </div>
))

ProfileContent.displayName = 'ProfileContent'

export default function Profile() {
  const { auth, updateAuth } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (auth) {
      setFormData({
        name: auth.name,
        email: auth.email
      })
    }
  }, [auth])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await authService.put('/user/profile/update', formData)
      const data = response.data

      updateAuth({
        ...auth,
        name: data.name,
        email: data.email
      })
      setIsEditing(false)
    } catch (err) {
      setError('Failed to update profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: auth.name,
      email: auth.email
    })
    setIsEditing(false)
    setError('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <ProfileLayout
      settings={<Settings />}
      subscription={<Subscription />}
      orders={<Orders />}
    >
      <ProfileContent
        auth={auth}
        isEditing={isEditing}
        formData={formData}
        error={error}
        isLoading={isLoading}
        onEdit={() => setIsEditing(true)}
        onSubmit={handleSubmit}
        onChange={handleInputChange}
        onCancel={handleCancel}
      />
    </ProfileLayout>
  )
}