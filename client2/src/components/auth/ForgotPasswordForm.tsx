'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface ForgotPasswordFormProps {
  onBackToLogin: () => void
}

export function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to process request')
      }

      setSuccess(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950 rounded">
          {error}
        </div>
      )}

      {success ? (
        <div className="text-center space-y-4">
          <div className="p-3 text-sm text-green-500 bg-green-50 dark:bg-green-950 rounded">
            Password reset instructions have been sent to your email.
          </div>
          <Button
            type="button"
            onClick={onBackToLogin}
            className="w-full"
          >
            Back to Sign In
          </Button>
        </div>
      ) : (
        <>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-light-foreground dark:text-dark-foreground">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-light-accent dark:border-dark-accent rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-light-background dark:bg-dark-background text-light-foreground dark:text-dark-foreground"
            />
          </div>

          <div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Reset Password'}
            </Button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              Back to Sign In
            </button>
          </div>
        </>
      )}
    </form>
  )
}