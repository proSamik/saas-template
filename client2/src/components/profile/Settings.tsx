'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function Settings() {
  const { data: session } = useSession()
  const router = useRouter()

  if (!session) {
    router.push('/auth/login')
    return null
  }

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    try {
      // TODO: Implement password reset using Next-Auth
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      })

      if (!response.ok) {
        throw new Error('Failed to reset password')
      }

      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError('Failed to reset password. Please try again.')
    }
  }

  return (
    <div className="space-y-6 p-4">
      <h3 className="text-2xl font-semibold text-light-foreground dark:text-dark-foreground">
        Settings
      </h3>

      <div className="rounded-lg bg-light-card dark:bg-dark-card p-6 shadow-sm">
        <h4 className="text-xl font-medium text-light-foreground dark:text-dark-foreground mb-4">
          Reset Password
        </h4>

        <form onSubmit={handleResetPassword} className="flex flex-col space-y-4 w-full max-w-md">
          <input
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-2 rounded-md border border-light-accent dark:border-dark-accent bg-light-background dark:bg-dark-background text-light-foreground dark:text-dark-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />

          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 rounded-md border border-light-accent dark:border-dark-accent bg-light-background dark:bg-dark-background text-light-foreground dark:text-dark-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />

          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 rounded-md border border-light-accent dark:border-dark-accent bg-light-background dark:bg-dark-background text-light-foreground dark:text-dark-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          {success && (
            <p className="text-sm text-green-600 dark:text-green-400">
              Password updated successfully!
            </p>
          )}

          <button
            type="submit"
            className="w-full px-4 py-2 text-white bg-primary-600 hover:bg-primary-500 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
          >
            Update Password
          </button>
        </form>
      </div>
    </div>
  )
}