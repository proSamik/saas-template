'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authService } from '@/services/auth'

export default function ResetPassword() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)

  const token = searchParams.get('token')

  const validatePassword = (password: string): string[] => {
    const errors: string[] = []
    if (password.length < 8) errors.push('Password must be at least 8 characters long')
    if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter')
    if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter')
    if (!/[0-9]/.test(password)) errors.push('Password must contain at least one number')
    if (!/[^A-Za-z0-9]/.test(password)) errors.push('Password must contain at least one special character')
    return errors
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      setIsLoading(false)
      return
    }

    const passwordErrors = validatePassword(password)
    if (passwordErrors.length > 0) {
      setIsLoading(false)
      passwordErrors.forEach(error => toast.error(error))
      return
    }

    if (!token) {
      toast.error('Invalid or expired reset token')
      router.push('/auth/forgot-password')
      return
    }

    try {
      await authService.resetPassword(token, password)
      toast.success('Password has been reset successfully')
      router.push('/auth/login')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password')
      if (error.response?.status === 401) {
        router.push('/auth/forgot-password')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    router.push('/auth/forgot-password')
    return null
  }

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background">
      <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-light-foreground dark:text-dark-foreground">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-light-muted dark:text-dark-muted">
            Enter your new password below.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-light-background dark:bg-dark-background px-4 py-8 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={onSubmit}>
              <Input
                id="password"
                name="password"
                type="password"
                label="New password"
                autoComplete="new-password"
                required
              />

              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                label="Confirm new password"
                autoComplete="new-password"
                required
              />

              <Button type="submit" fullWidth isLoading={isLoading}>
                {isLoading ? 'Resetting password...' : 'Reset password'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}