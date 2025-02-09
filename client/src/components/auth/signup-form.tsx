'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SocialButton } from '@/components/ui/social-button'
import { authService } from '@/services/auth'
import { useAuth } from '@/contexts/AuthContext'
import { AuthError } from '@/components/auth/error'

interface SignUpFormProps {
  onSignInClick: () => void
}

export function SignUpForm({ onSignInClick }: SignUpFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const { setAuth } = useAuth()

  const validatePassword = (password: string): string[] => {
    const errors: string[] = []
    if (password.length < 8) errors.push('Password must be at least 8 characters long')
    if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter')
    if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter')
    if (!/[0-9]/.test(password)) errors.push('Password must contain at least one number')
    if (!/[^A-Za-z0-9]/.test(password)) errors.push('Password must contain at least one special character')
    return errors
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(undefined)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    }

    const passwordErrors = validatePassword(data.password)
    if (passwordErrors.length > 0) {
      setIsLoading(false)
      setError(passwordErrors.join(' '))
      passwordErrors.forEach(error => toast.error(error))
      return
    }

    try {
      // Register the user
      await authService.register(data)

      // Login the user
      const response = await authService.login({
        email: data.email,
        password: data.password
      })
      
      // Store the auth response
      setAuth({
        id: response.id,
        name: response.name,
        email: response.email
      })

      router.push('/profile')
      toast.success('Account created successfully!')
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to create account'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      const client = window.google.accounts.oauth2.initCodeClient({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        scope: 'email profile',
        ux_mode: 'redirect',
        redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || 'http://localhost:3000/callback/google',
        callback: async (response: { code: string }) => {
          if (response.code) {
            try {
              const authResponse = await authService.googleLogin(response.code)
              setAuth({
                id: authResponse.id,
                name: authResponse.name,
                email: authResponse.email
              })
              router.push('/profile')
              toast.success('Logged in with Google successfully!')
            } catch (error: any) {
              toast.error(error.response?.data?.message || 'Failed to authenticate with Google')
            }
          }
          setIsLoading(false)
        }
      })
      client.requestCode()
    } catch (error: any) {
      setIsLoading(false)
      toast.error('Failed to initialize Google Sign-In')
    }
  }

  return (
    <div className="space-y-6">
      <AuthError message={error} />
      
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

      <div>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-light-accent dark:border-dark-accent" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-light-card dark:bg-dark-card px-2 text-light-muted dark:text-dark-muted">
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

      <div className="text-center">
        <button
          type="button"
          onClick={onSignInClick}
          className="text-sm font-medium text-light-accent dark:text-dark-accent hover:text-opacity-90"
        >
          Already have an account? Sign in
        </button>
      </div>
    </div>
  )
} 