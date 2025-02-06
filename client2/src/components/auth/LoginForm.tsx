'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface LoginFormProps {
  onForgotPassword: () => void
  onSignupClick: () => void
}

export function LoginForm({ onForgotPassword, onSignupClick }: LoginFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
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

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-sm text-primary-600 hover:text-primary-500"
        >
          Forgot your password?
        </button>
      </div>

      <div>
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
      </div>

      <div className="text-center">
        <span className="text-sm text-light-foreground dark:text-dark-foreground">
          Don't have an account?{' '}
        </span>
        <button
          type="button"
          onClick={onSignupClick}
          className="text-sm text-primary-600 hover:text-primary-500"
        >
          Sign up
        </button>
      </div>
    </form>
  )
}