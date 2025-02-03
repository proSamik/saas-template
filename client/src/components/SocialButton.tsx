'use client'

import api from '@/lib/axios'
import { useRouter } from 'next/navigation'

type SocialButtonProps = {
  provider: string
  icon: React.ReactNode
  children: React.ReactNode
  onClick?: () => Promise<void>
}

/**
 * SocialButton component for social media authentication
 * Provides a consistent style for all social login buttons
 */
export function SocialButton({ provider, icon, children, onClick }: SocialButtonProps) {
  const router = useRouter()

  const handleClick = async () => {
    console.log('[SocialButton] Clicked:', provider)
    if (onClick) {
      await onClick()
    } else {
      console.log('[SocialButton] Using default sign in')
      try {
        const response = await api.post(`/auth/oauth/${provider}`)
        if (response.data.authUrl) {
          window.location.href = response.data.authUrl
        }
      } catch (error) {
        console.error('[SocialButton] Sign in error:', error)
      }
    }
  }

  return (
    <button
      onClick={handleClick}
      className="flex w-full items-center justify-center gap-3 rounded-md border border-light-accent dark:border-dark-accent bg-light-background dark:bg-dark-background px-4 py-2 text-sm font-medium text-light-foreground dark:text-dark-foreground shadow-sm hover:bg-light-accent dark:hover:bg-dark-accent focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
    >
      {icon}
      <span className="text-sm font-semibold leading-6">{children}</span>
    </button>
  )
}