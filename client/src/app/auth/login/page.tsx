'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Input } from '@/components/Input'
import { Button } from '@/components/Button'
import { SocialButton } from '@/components/SocialButton'

/**
 * Login page component that handles user authentication
 * Supports email/password and social login
 */
export default function Login() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error(result.error)
        return
      }

      router.push('/dashboard')
      toast.success('Logged in successfully!')
    } catch (error: any) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-light-background dark:bg-dark-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-light-foreground dark:text-dark-foreground">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-light-muted dark:text-dark-muted">
          Or{' '}
          <Link href="/auth/signup" className="font-medium text-primary-600 hover:text-primary-500">
            create a new account
          </Link>
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
              required
            />

            <div>
              <Input
                id="password"
                name="password"
                type="password"
                label="Password"
                autoComplete="current-password"
                required
              />
              <div className="mt-2 flex items-center justify-end">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <Button type="submit" fullWidth isLoading={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-light-accent dark:border-dark-accent" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-light-background dark:bg-dark-background px-2 text-light-muted dark:text-dark-muted">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6">
              <SocialButton
                provider="google"
                icon={
                  <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                    <path
                      d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                      fill="#EA4335"
                    />
                    <path
                      d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.27028 9.7049L1.28027 6.60986C0.47027 8.22986 0 10.0599 0 11.9999C0 13.9399 0.47027 15.7699 1.28027 17.3899L5.26498 14.2949Z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12.0004 24C15.2354 24 17.9504 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.87043 19.245 6.21542 17.135 5.26544 14.29L1.27544 17.385C3.25544 21.31 7.31044 24 12.0004 24Z"
                      fill="#34A853"
                    />
                  </svg>
                }
              >
                Google
              </SocialButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 