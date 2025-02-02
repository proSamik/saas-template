/**
 * NextAuth configuration and setup for authentication
 * 
 * This module configures NextAuth.js for handling authentication in the application.
 * It sets up:
 * - Credentials provider for email/password login
 * - Google OAuth provider for social login
 * - Custom session and JWT type extensions
 * - Authentication callbacks for sign in, JWT, and session handling
 * - Custom error and login pages
 */

import NextAuth from 'next-auth'
import type { NextAuthConfig } from 'next-auth'
import type { DefaultSession } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import axios from 'axios'
const crypto = require('crypto');

// Extend the built-in session type to include custom fields
declare module 'next-auth' {
  interface Session {
    user: {
      id: string | undefined
    } & DefaultSession['user']
    accessToken?: string
  }

  interface User {
    accessToken?: string
  }

  interface SignInCallbackParams {
    trigger?: 'signIn' | 'link'
  }
}

// Extend the JWT type to include custom fields
declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    accessToken?: string
  }
}

// Type definition for the authentication response from our API
interface AuthUser {
  id: string
  email: string
  name: string
  token: string
}

// Type definition for linked accounts
interface LinkedAccount {
  id: string
  provider: string
  email: string
}

// Add server health check function
async function checkServerHealth() {
  try {
    await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/health`)
    return true
  } catch (error) {
    console.error('[NextAuth] Server health check failed:', error)
    return false
  }
}

export const authConfig = {
  providers: [
    // Email/password authentication provider
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      // Delegate authentication to server
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Forward credentials to server for authentication
          const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
            email: credentials.email,
            password: credentials.password,
          })

          const userData = response.data as AuthUser
          return {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            accessToken: userData.token
          }
        } catch (error: any) {
          throw new Error(error.response?.data?.message || 'Authentication failed')
        }
      },
    }),
    // Google OAuth provider configuration - Server handles the OAuth flow
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: 'openid email profile'
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          // Ensure we have all required data before making the request
          if (!account.access_token || !account.id_token) {
            console.error('[NextAuth] Missing required OAuth tokens');
            return false;
          }

          // Forward OAuth data to server for authentication and registration
          const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/google`, {
            access_token: account.access_token,
            id_token: account.id_token,
            user: {
              email: profile?.email,
              name: profile?.name,
              image: profile?.image
            }
          })
          
          const userData = response.data as AuthUser
          if (userData && userData.id && userData.token) {
            user.id = userData.id
            user.name = userData.name || profile?.name
            user.email = userData.email || profile?.email
            user.accessToken = userData.token
            return true
          }
          console.error('[NextAuth] Invalid user data received from server');
          return false
        } catch (error: any) {
          console.error('[NextAuth] Google authentication failed:', error.response?.data || error.message);
          return false
        }
      }
      return true
    },
    // Manage JWT token creation and updates
    async jwt({ token, user }) {
      console.log('[NextAuth] JWT callback:', { userId: user?.id, tokenId: token.id })
      
      if (user) {
        // Ensure user ID is properly set in the token
        token.id = user.id || token.id
        token.accessToken = user.accessToken || token.accessToken
      } else if (Date.now() > (token.exp || 0) * 1000) {
        try {
          // Token has expired, attempt to refresh
          const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
            refreshToken: token.refreshToken
          })
          
          // Update token with new values
          token.accessToken = response.data.token
          token.refreshToken = response.data.refreshToken
          token.exp = response.data.expiresAt
        } catch (error) {
          console.error('[NextAuth] Token refresh failed:', error)
          // Token refresh failed, user needs to re-authenticate
          return { ...token, error: 'RefreshAccessTokenError' }
        }
      }
      return token
    },
    // Handle session data and token synchronization
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id
      }
      if (token.accessToken) {
        session.accessToken = token.accessToken
        // Add the token to the user object as well for better type safety
        if (session.user) {
          session.user.accessToken = token.accessToken
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
    newUser: '/auth/signup',
    verifyRequest: '/auth/verify-request',
  },
  debug: process.env.NODE_ENV === 'development',
} satisfies NextAuthConfig

// Initialize and export NextAuth handlers and utilities
export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
})
