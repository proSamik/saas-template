'use client'

import { SessionProvider } from 'next-auth/react'

/**
 * AuthProvider component that wraps the application with NextAuth's SessionProvider
 * to enable authentication state management
 */
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return <SessionProvider>{children}</SessionProvider>
} 