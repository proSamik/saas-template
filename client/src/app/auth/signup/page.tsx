'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Navigation from '@/components/Navigation'
import { SocialButton } from '@/components/ui/social-button'
import { authService } from '@/services/auth'
import useAuthStore from '@/lib/store'

export default function SignUp() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const setAuth = useAuthStore(state => state.setAuth)

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) errors.push('Password must be at least 8 characters long');
    if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('Password must contain at least one number');
    if (!/[^A-Za-z0-9]/.test(password)) errors.push('Password must contain at least one special character');
    return errors;
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setIsLoading(false);
      passwordErrors.forEach(error => toast.error(error));
      return;
    }

    try {
      // Register the user
      await authService.register({
        email,
        password,
        name,
      })

      // Login the user
      const loginResponse = await authService.login({
        email,
        password
      })
      
      // Store the entire auth response in Zustand store
      setAuth({
        id: loginResponse.id,
        token: loginResponse.token,
        expiresAt: loginResponse.expiresAt,
        name: loginResponse.name,
        email: loginResponse.email
      })

      // Set the auth header for future requests
      authService.setAuthHeader(loginResponse.token)

      router.push('/dashboard')
      toast.success('Account created successfully!')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    // TODO: Implement Google OAuth flow
    toast.error('Google sign-in is not yet implemented')
  }

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background">
      <Navigation />
      
      <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-light-foreground dark:text-dark-foreground">
            Create your account
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
            <form className="space-y-6" onSubmit={onSubmit}>
              <Input
                id="name"
                name="name"
                type="text"
                label="Full name"
                autoComplete="name"
                required
              />

              <Input
                id="email"
                name="email"
                type="email"
                label="Email address"
                autoComplete="email"
                required
              />

              <Input
                id="password"
                name="password"
                type="password"
                label="Password"
                autoComplete="new-password"
                required
              />

              <Button type="submit" fullWidth isLoading={isLoading}>
                {isLoading ? 'Creating account...' : 'Create account'}
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
                  onClick={handleGoogleSignIn}
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
    </div>
  )
}