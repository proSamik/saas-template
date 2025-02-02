/**
 * NextAuth configuration and setup for authentication
 * 
 * This module configures NextAuth.js to integrate with our custom authentication server.
 * It handles:
 * - Email/password authentication via credentials provider
 * - Google OAuth authentication
 * - JWT token management with refresh token support
 * - Session synchronization with server-side state
 */

import NextAuth from 'next-auth'
import type { NextAuthConfig, Session, User as AuthUser, Account, Profile } from 'next-auth'
import type { DefaultSession } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import type { AdapterUser } from 'next-auth/adapters'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import axios from 'axios'

// Server response types
interface AuthResponse {
  id: string
  token: string
  refreshToken: string
  expiresAt: number
  name: string
  email: string
}

// Extend the built-in session type
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      accessToken?: string
      refreshToken?: string
      provider?: string
    }
    error?: string
  }

  interface User extends AuthResponse {}
}

// Extend the JWT type
declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    accessToken: string
    refreshToken: string
    expiresAt: number
    error?: string
    provider?: string
  }
}

export const authConfig = {
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
            credentials
          )

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
    async signIn({ user, account, profile }: { user: AuthUser | AdapterUser; account: Account | null; profile?: Profile }) {
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
                image: profile?.image
              }
            }
          )
          
          console.log('[NextAuth] Google auth server response:', {
            id: response.data.id,
            name: response.data.name,
            email: response.data.email,
            expiresAt: new Date(response.data.expiresAt * 1000).toISOString()
          })

          // Update user object with server response
          Object.assign(user, {
            id: response.data.id,
            token: response.data.token,
            refreshToken: response.data.refreshToken,
            expiresAt: response.data.expiresAt,
            name: response.data.name,
            email: response.data.email,
            sessionToken: undefined // Force NextAuth to create a new session
          })

          console.log('[NextAuth] Updated user object:', {
            id: user.id,
            name: user.name,
            email: user.email,
            expiresAt: new Date(user.expiresAt * 1000).toISOString()
          })
          return true
        } catch (error: any) {
          console.error('Google authentication failed:', error.response?.data || error)
          return false
        }
      }

      // For credentials provider, ensure session reset
      if (user && !account) {
        Object.assign(user, { sessionToken: undefined })
      }
      return true
    },

    async jwt({ token, user, account }: { token: JWT; user?: AuthUser | AdapterUser; account?: Account | null }): Promise<JWT> {
      // Initial sign in
      if (user && 'token' in user && typeof user.token === 'string') {
        console.log('[NextAuth] Initial JWT creation:', {
          userId: user.id,
          provider: account?.provider || 'credentials',
          expiresAt: new Date(user.expiresAt * 1000).toISOString()
        })

        // Ensure type safety by validating server response fields
        return {
          ...token,
          id: user.id,
          accessToken: user.token, // Map server's 'token' to client's 'accessToken'
          refreshToken: user.refreshToken,
          expiresAt: user.expiresAt,
          provider: account?.provider || 'credentials'
        } as JWT
      }

      // Return previous token if not expired and not blacklisted
      if (Date.now() < token.expiresAt * 1000) {
        try {
          // Verify token is still valid by making a test request
          await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify`, {
            headers: { Authorization: `Bearer ${token.accessToken}` }
          })
          return token
        } catch (error: any) {
          if (error.response?.status === 401) {
            // Token is invalid (possibly blacklisted), force refresh flow
            console.log('[NextAuth] Token invalid, forcing refresh flow')
            token.expiresAt = 0 // Force token refresh
            return token
          } else {
            // For other errors, return existing token
            return token
          }
        }
      }

      // Refresh token
      try {
        console.log('[NextAuth] Attempting token refresh:', {
          userId: token.id,
          provider: token.provider,
          currentToken: token.accessToken.slice(0, 10) + '...'
        })

        const response = await axios.post<AuthResponse>(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          {
            refreshToken: token.refreshToken,
            provider: token.provider
          }
        )

        console.log('[NextAuth] Token refresh response:', {
          userId: token.id,
          newExpiresAt: new Date(response.data.expiresAt * 1000).toISOString()
        })

        return {
          ...token,
          accessToken: response.data.token,
          refreshToken: response.data.refreshToken,
          expiresAt: response.data.expiresAt
        }
      } catch (error) {
        console.error('Error refreshing token:', error)
        return {
          ...token,
          error: 'RefreshAccessTokenError'
        }
      }
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      if (token) {
        session.user.id = token.id
        session.user.accessToken = token.accessToken
        session.error = token.error

        console.log('[NextAuth] Detailed session update:', {
          session: {
            userId: session.user.id,
            name: session.user.name,
            email: session.user.email,
            error: session.error || 'none',
            hasAccessToken: !!session.user.accessToken
          },
          token: {
            id: token.id,
            provider: token.provider,
            expiresAt: new Date(token.expiresAt * 1000).toISOString(),
            hasRefreshToken: !!token.refreshToken,
            error: token.error || 'none'
          }
        })
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
    newUser: '/auth/signup'
  },
  session: { strategy: 'jwt' as const },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development'
}

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth(authConfig)
