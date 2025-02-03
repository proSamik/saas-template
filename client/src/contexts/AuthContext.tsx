'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface AuthState {
  id: string
  token: string
  expiresAt: number
  name: string
  email: string
}

interface AuthContextType {
  auth: AuthState | null
  setAuth: (auth: AuthState | null) => void
  isAuthenticated: boolean
  user: AuthState | null
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(null)

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedAuth = localStorage.getItem('auth')
    if (storedAuth) {
      try {
        const parsedAuth = JSON.parse(storedAuth)
        setAuth(parsedAuth)
      } catch (error) {
        console.error('Error parsing stored auth:', error)
        localStorage.removeItem('auth')
      }
    }
  }, [])

  // Update localStorage when auth state changes
  useEffect(() => {
    if (auth) {
      localStorage.setItem('auth', JSON.stringify(auth))
    } else {
      localStorage.removeItem('auth')
    }
  }, [auth])

  const logout = async () => {
    setAuth(null)
    localStorage.removeItem('auth')
  }

  return (
    <AuthContext.Provider value={{
      auth,
      setAuth,
      isAuthenticated: !!auth,
      user: auth,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}