'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authService } from '@/services/auth'

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email') as string

    try {
      await authService.forgotPassword(email)
      setEmailSent(true)
      toast.success('Password reset instructions have been sent to your email')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-light-background dark:bg-dark-background">
        <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-light-foreground dark:text-dark-foreground">
              Check your email
            </h2>
            <p className="mt-2 text-center text-sm text-light-muted dark:text-dark-muted">
              We've sent password reset instructions to your email address.
            </p>
            <div className="mt-4 text-center">
              <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
                Return to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background">
      <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-light-foreground dark:text-dark-foreground">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-light-muted dark:text-dark-muted">
            Enter your email address and we'll send you instructions to reset your password.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-light-background dark:bg-dark-background px-4 py-8 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={onSubmit}>
              <Input
                id="email"
                name="email"
                type="email"
                label="Email address"
                autoComplete="email"
                placeholder="Enter your email address"
                required
              />

              <Button type="submit" fullWidth isLoading={isLoading}>
                {isLoading ? 'Sending instructions...' : 'Send reset instructions'}
              </Button>

              <div className="text-center">
                <Link href="/auth/login" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                  Return to sign in
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}