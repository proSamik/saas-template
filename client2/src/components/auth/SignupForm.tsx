'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'

interface SignupFormProps {
  onLoginClick: () => void
}

export function SignupForm({ onLoginClick }: SignupFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to create account')
      }

      // After successful registration, sign in automatically
      await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        callbackUrl: '/dashboard'
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred during signup')
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

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-light-foreground dark:text-dark-foreground">
          Full Name
        </label>
        <input
          id="name"
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="mt-1 block w-full px-3 py-2 border border-light-accent dark:border-dark-accent rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-light-background dark:bg-dark-background text-light-foreground dark:text-dark-foreground"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-light-foreground dark:text-dark-foreground">
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className="mt-1 block w-full px-3 py-2 border border-light-accent dark:border-dark-accent rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-light-background dark:bg-dark-background text-light-foreground dark:text-dark-foreground"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-light-foreground dark:text-dark-foreground">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          className="mt-1 block w-full px-3 py-2 border border-light-accent dark:border-dark-accent rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-light-background dark:bg-dark-background text-light-foreground dark:text-dark-foreground"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-light-foreground dark:text-dark-foreground">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          required
          value={formData.confirmPassword}
          onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
          className="mt-1 block w-full px-3 py-2 border border-light-accent dark:border-dark-accent rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-light-background dark:bg-dark-background text-light-foreground dark:text-dark-foreground"
        />
      </div>

      <div>
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Creating account...' : 'Sign up'}
        </Button>
      </div>

      <div className="text-center">
        <span className="text-sm text-light-foreground dark:text-dark-foreground">
          Already have an account?{' '}
        </span>
        <button
          type="button"
          onClick={onLoginClick}
          className="text-sm text-primary-600 hover:text-primary-500"
        >
          Sign in
        </button>
      </div>
    </form>
  )
}