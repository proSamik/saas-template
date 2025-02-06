'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/auth/LoginForm'
import { SignupForm } from '@/components/auth/SignupForm'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

type AuthMode = 'login' | 'signup' | 'forgot-password'

export default function AuthPage() {
  const { data: session } = useSession()
  const [mode, setMode] = useState<AuthMode>('login')

  // Redirect if user is already authenticated
  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-light-background dark:bg-dark-background">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-light-foreground dark:text-dark-foreground">
            {mode === 'login' && 'Sign in to your account'}
            {mode === 'signup' && 'Create your account'}
            {mode === 'forgot-password' && 'Reset your password'}
          </h2>
        </div>

        <div className="mt-8">
          {mode === 'login' && (
            <LoginForm
              onForgotPassword={() => setMode('forgot-password')}
              onSignupClick={() => setMode('signup')}
            />
          )}
          {mode === 'signup' && (
            <SignupForm
              onLoginClick={() => setMode('login')}
            />
          )}
          {mode === 'forgot-password' && (
            <ForgotPasswordForm
              onBackToLogin={() => setMode('login')}
            />
          )}
        </div>
      </div>
    </div>
  )
}