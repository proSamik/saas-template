'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authService } from '@/services/auth'
import { AuthError } from '@/components/auth/error'

interface ForgotPasswordFormProps {
  onBackToSignInClick: () => void
}

export function ForgotPasswordForm({ onBackToSignInClick }: ForgotPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(undefined)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string

    try {
      await authService.forgotPassword(email)
      setEmailSent(true)
      toast.success('Password reset instructions sent to your email')
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to send reset instructions'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-light-foreground dark:text-dark-foreground">
            Check your email
          </h3>
          <p className="mt-2 text-sm text-light-muted dark:text-dark-muted">
            We have sent password reset instructions to your email address.
          </p>
        </div>

        <Button type="button" fullWidth onClick={onBackToSignInClick}>
          Back to sign in
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AuthError message={error} />

      <div>
        <p className="text-sm text-light-muted dark:text-dark-muted">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <form className="space-y-6" onSubmit={onSubmit}>
        <Input
          id="email"
          name="email"
          type="email"
          label="Email address"
          autoComplete="email"
          required
        />

        <div className="flex flex-col space-y-2">
          <Button type="submit" fullWidth isLoading={isLoading}>
            {isLoading ? 'Sending...' : 'Send reset link'}
          </Button>

          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={onBackToSignInClick}
          >
            Back to sign in
          </Button>
        </div>
      </form>
    </div>
  )
} 