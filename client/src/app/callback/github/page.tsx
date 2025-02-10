'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

import { authService } from '@/services/auth'
import { useAuth } from '@/contexts/AuthContext'

export default function GithubCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setAuth } = useAuth()

  useEffect(() => {
    const code = searchParams.get('code')

    if (!code) {
      toast.error('Authentication failed')
      router.push('/auth')
      return
    }

    const handleCallback = async () => {
      try {
        const authResponse = await authService.githubLogin(code)

        // Send the auth response back to the opener window
        if (window.opener) {
          window.opener.postMessage({
            type: 'GITHUB_AUTH_SUCCESS',
            data: authResponse
          }, '*')
          // Close this window
          window.close()
        } else {
          // Fallback if no opener window exists
          setAuth({
            id: authResponse.id,
            name: authResponse.name,
            email: authResponse.email,
            emailVerified: authResponse.email_verified
          })

          router.push('/profile')
          toast.success('Logged in with GitHub successfully!')
        }
      } catch (error: any) {
        // Send error back to opener window if it exists
        if (window.opener) {
          window.opener.postMessage({
            type: 'GITHUB_AUTH_ERROR',
            error: error.response?.data?.message || 'Failed to authenticate with GitHub'
          }, '*')
          window.close()
        } else {
          toast.error(error.response?.data?.message || 'Failed to authenticate with GitHub')
          router.push('/auth')
        }
      }
    }

    handleCallback()
  }, [])

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-light-foreground dark:text-dark-foreground mb-4">
          Completing authentication...
        </h2>
        <p className="text-light-muted dark:text-dark-muted">
          Please wait while we complete your sign in.
        </p>
      </div>
    </div>
  )
} 