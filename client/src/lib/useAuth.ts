import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useAuthStore from '@/lib/store'
import api from '@/lib/axios'

interface User {
  id: string
  name: string
  email: string
}

interface AuthState {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { accessToken, setAccessToken, clearAuth } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      if (!accessToken) {
        setUser(null)
        setLoading(false)
        return
      }

      try {
        // Verify token and fetch user data
        const response = await api.get('/user/profile')
        if (response.data?.user) {
          setUser(response.data.user)
        }
      } catch (error: any) {
        if (error.response?.status === 401) {
          try {
            // Attempt to refresh the token
            await api.post('/auth/refresh', {}, { withCredentials: true })
            // Retry the original request after token refresh
            const retryResponse = await api.get('/user/profile')
            if (retryResponse.data?.user) {
              setUser(retryResponse.data.user)
              setLoading(false)
              return
            }
          } catch (refreshError) {
            console.error('[Auth Debug] Token refresh failed:', refreshError)
            clearAuth()
            setUser(null)
            router.push('/auth/login')
            return
          }
        }
        clearAuth()
        setUser(null)
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Set up periodic token verification
    const interval = setInterval(checkAuth, 4 * 60 * 1000) // Check every 4 minutes

    return () => clearInterval(interval)
  }, [accessToken, clearAuth, router])

  return {
    user,
    loading,
    isAuthenticated: !!accessToken
  }
}