'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import axios from 'axios'
import { Input } from '@/components/Input'
import { Button } from '@/components/Button'

/**
 * ResetPassword page component that handles password reset
 * Requires a valid reset token from the URL
 */
export default function ResetPassword() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)

  const token = searchParams.get('token')

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

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
        token,
        password,
      })

      toast.success('Password reset successfully')
      router.push('/auth/login')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-light-background dark:bg-dark-background">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-light-background dark:bg-dark-background px-4 py-8 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <h3 className="text-lg font-medium text-light-foreground dark:text-dark-foreground">
                Invalid reset link
              </h3>
              <p className="mt-2 text-sm text-light-muted dark:text-dark-muted">
                This password reset link is invalid or has expired.
              </p>
              <div className="mt-6">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  Request a new reset link
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-light-background dark:bg-dark-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-light-foreground dark:text-dark-foreground">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-light-muted dark:text-dark-muted">
          Enter your new password below
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
              {isLoading ? 'Resetting...' : 'Reset password'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
} 