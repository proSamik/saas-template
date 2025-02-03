'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/lib/store'
import api from '@/lib/axios'
import { useAuth } from '@/lib/useAuth'

/**
 * AuthProvider component that manages JWT-based authentication state
 * and handles token refresh
 */
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  // Use the enhanced useAuth hook for authentication logic
  useAuth()
  return <>{children}</>
}