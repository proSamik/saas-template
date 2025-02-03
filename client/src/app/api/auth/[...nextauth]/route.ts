/**
 * NextAuth configuration and setup for authentication
 * 
 * This module configures NextAuth.js to integrate with our custom authentication server.
 * It handles:
 * - Email/password authentication via credentials provider
 * - Google OAuth authentication
 * - JWT token management with refresh token support
 * - Stateless authentication with HTTP-only cookie refresh tokens
 */

import NextAuth from 'next-auth'
import type { NextAuthConfig, Account, Profile, User } from 'next-auth'
import type { AdapterUser } from 'next-auth/adapters'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import axios from 'axios'
import useAuthStore from '@/lib/store'

// Server response types
interface AuthResponse {
  id: string
  token: string
  refreshToken: string
  expiresAt: number
  name: string
  email: string
  provider?: string
  image?: string | null
}

// Extend the built-in user type
declare module 'next-auth' {
  interface User extends AuthResponse {
    emailVerified?: Date | null
  }
}

export const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const response = await axios.post<AuthResponse>(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
            credentials,
            { withCredentials: true } // Enable cookie handling
          )

          // Store authentication data in our custom store
          if (typeof window !== 'undefined') {
            console.log('[Auth Debug] Storing credentials auth data:', {
              hasToken: !!response.data.token,
              expiresAt: response.data.expiresAt,
              userId: response.data.id
            })
            useAuthStore.getState().setAuth(response.data.token, response.data.expiresAt)
            useAuthStore.getState().setUser({
              id: response.data.id,
              name: response.data.name,
              email: response.data.email,
            })
            useAuthStore.getState().setAccessToken(response.data.token)
            console.log('[Auth Debug] Credentials auth data stored successfully')
          } else {
            console.log('[Auth Debug] Window object not available - running on server side')
          }

          return response.data
        } catch (error: any) {
          throw new Error(error.response?.data?.message || 'Authentication failed')
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      }
    })
  ],
  callbacks: {
    async signIn(params: {
      user: User | AdapterUser
      account: Account | null
      profile?: Profile
      email?: { verificationRequest?: boolean }
      credentials?: Record<string, any>
    }) {
      const { user, account, profile } = params
      
      if (account?.provider === 'google') {
        try {
          const response = await axios.post<AuthResponse>(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/google`,
            {
              access_token: account.access_token,
              id_token: account.id_token,
              user: {
                email: profile?.email,
                name: profile?.name,
                image: Array.isArray(profile?.image) && profile.image.length === 0 ? null : (typeof profile?.image === 'object' ? JSON.stringify(profile.image) : profile?.image)
              }
            },
            { 
              withCredentials: true,
              headers: {
                'User-Agent': 'NextAuth-Client'
              }
            }
          )

          // Update user object with server response
          Object.assign(user, {
            id: response.data.id,
            token: response.data.token,
            refreshToken: response.data.refreshToken,
            expiresAt: response.data.expiresAt,
            name: response.data.name,
            email: response.data.email,
            image: Array.isArray(profile?.image) && profile.image.length === 0 ? null : (typeof profile?.image === 'object' ? JSON.stringify(profile.image) : profile?.image)
          })

          // Store authentication data in our custom store
          console.log('[Auth Debug] Storing Google auth data:', {
            hasToken: !!response.data.token,
            expiresAt: response.data.expiresAt,
            userId: response.data.id
          })

          // Set auth data in the store regardless of window availability
          const store = useAuthStore.getState()
          store.setAuth(response.data.token, response.data.expiresAt)
          store.setUser({
            id: response.data.id,
            name: response.data.name,
            email: response.data.email,
          })
          store.setAccessToken(response.data.token)

          console.log('[Auth Debug] Google auth data stored successfully')
          return true
        } catch (error: any) {
          console.error('[Auth Debug] Google authentication failed:', error.response?.data || error)
          return false
        }
      }

      return true
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
    newUser: '/auth/signup'
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development'
}

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth(authConfig)
