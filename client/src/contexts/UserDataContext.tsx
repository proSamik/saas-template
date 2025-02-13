import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { authService } from '@/services/auth'

interface UserData {
  subscription: {
    status: string | null
    productId: number | null
    variantId: number | null
  }
}

interface UserDataContextType {
  userData: UserData | null
  loading: boolean
  error: string | null
  refreshUserData: () => Promise<void>
  clearUserData: () => void
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined)

export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const { auth, isAuthenticated } = useAuth()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const clearUserData = () => {
    setUserData(null)
    document.cookie = 'userData=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; secure; samesite=strict'
  }

  const fetchUserData = async () => {
    if (!isAuthenticated || !auth) {
      clearUserData()
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Try to get data from cookie first
      const userDataCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('userData='))
      
      if (userDataCookie) {
        try {
          const cookieData = JSON.parse(decodeURIComponent(userDataCookie.split('=')[1]))
          setUserData(cookieData)
          setLoading(false)
          return
        } catch (e) {
          console.error('Error parsing userData cookie:', e)
        }
      }

      // If no cookie or invalid, fetch from API
      const subscriptionData = await authService.get('/user/verify-user')

      const newUserData = {
        subscription: {
          status: subscriptionData.status || null,
          productId: subscriptionData.product_id || null,
          variantId: subscriptionData.variant_id || null
        }
      }

      setUserData(newUserData)

      // Store in cookie for persistence
      document.cookie = `userData=${JSON.stringify(newUserData)}; path=/; max-age=3600; secure; samesite=strict`

    } catch (err) {
      setError('Failed to fetch user data')
      console.error('Error fetching user data:', err)
      clearUserData()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && auth) {
      fetchUserData()
    } else if (!isAuthenticated) {
      clearUserData()
    }
  }, [isAuthenticated, auth])

  const refreshUserData = async () => {
    await fetchUserData()
  }

  return (
    <UserDataContext.Provider value={{ userData, loading, error, refreshUserData, clearUserData }}>
      {children}
    </UserDataContext.Provider>
  )
}

export function useUserData() {
  const context = useContext(UserDataContext)
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider')
  }
  return context
} 