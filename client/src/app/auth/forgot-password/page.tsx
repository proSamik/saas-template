'use client'

import { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import axios from 'axios'
import { Input } from '@/components/Input'
import { Button } from '@/components/Button'

/**
 * ForgotPassword page component that handles password reset requests
 * Sends a reset link to the user's email
 */
export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email') as string

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
        email,
      })

      setEmailSent(true)
      toast.success('Password reset link sent to your email')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-light-background dark:bg-dark-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-light-foreground dark:text-dark-foreground">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-light-muted dark:text-dark-muted">
          Or{' '}
          <Link href="/auth/login" className="font-medium text-primary-600 hover:text-primary-500">
            sign in to your account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-light-background dark:bg-dark-background px-4 py-8 shadow sm:rounded-lg sm:px-10">
          {emailSent ? (
            <div className="text-center">
              <h3 className="text-lg font-medium text-light-foreground dark:text-dark-foreground">
                Check your email
              </h3>
              <p className="mt-2 text-sm text-light-muted dark:text-dark-muted">
                We have sent a password reset link to your email address.
              </p>
              <div className="mt-6">
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  Back to sign in
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={onSubmit}>
              <Input
                id="email"
                name="email"
                type="email"
                label="Email address"
                autoComplete="email"
                required
              />

              <Button type="submit" fullWidth isLoading={isLoading}>
                {isLoading ? 'Sending...' : 'Send reset link'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
} 