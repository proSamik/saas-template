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
      // Authorize user credentials against our API
      async authorize(credentials) {
        console.log('[NextAuth] Attempting credentials login:', { email: credentials?.email })
        
        if (!credentials?.email || !credentials?.password) {
          console.log('[NextAuth] Missing credentials')
          return null
        }

        try {
          console.log('[NextAuth] Making login request to API')
          const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
            email: credentials.email,
            password: credentials.password,
          })

          const userData = response.data as AuthUser
          console.log('[NextAuth] Login successful:', { id: userData.id, email: userData.email })
          
          // Explicitly set the id field in the returned user object
          const user = {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            accessToken: userData.token
          }
          
          return user
        } catch (error: any) {
          console.error('[NextAuth] Login failed:', error.response?.data || error.message)
          throw new Error(error.response?.data?.message || 'Invalid credentials')
        }
      },
    }),
    // Google OAuth provider configuration
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          state: require('crypto').randomBytes(32).toString('hex'), // Add CSRF protection
          code_challenge_method: 'S256', // Enable PKCE
          code_challenge: generateCodeChallenge(), // Add PKCE code challenge
          scope: 'openid email profile' // Explicitly define required scopes
        }
      }
    }),
  ],
  callbacks: {
    // Handle sign in process and validate with our API
    async signIn(params: any) {
      const { user, account, profile, trigger } = params
      console.log('[NextAuth] Sign in callback:', { 
        provider: account?.provider,
        email: user.email,
        trigger
      })

      // If this is a link operation, handle it as optional
      if (trigger === 'link') {
        try {
          console.log('[NextAuth] Attempting optional account linking')
          const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/link`, {
            provider: account?.provider,
            token: account?.id_token,
            user: {
              email: profile?.email,
              name: profile?.name,
              image: profile?.image
            }
          }, {
            headers: {
              'Authorization': `Bearer ${user.accessToken}`
            }
          })
          
          // Handle the response data for successful linking
          const linkedAccount = response.data as LinkedAccount
          if (linkedAccount && linkedAccount.id) {
            console.log('[NextAuth] Account linked successfully:', { accountId: linkedAccount.id })
          }
        } catch (error: any) {
          // Log the error but continue with authentication
          console.log('[NextAuth] Optional account linking skipped:', error.response?.data || error.message)
        }
        // Always return true to continue authentication flow
        return true
      }

      if (account?.provider === 'google') {
        try {
          console.log('[NextAuth] Processing Google sign in')
          const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/google`, {
            token: account.id_token,
            user: {
              email: profile?.email,
              name: profile?.name,
              image: profile?.image
            }
          })
          
          const userData = response.data as AuthUser
          if (userData) {
            console.log('[NextAuth] Google sign in successful:', { id: userData.id })
            user.id = userData.id
            user.name = userData.name
            user.email = userData.email
            user.accessToken = userData.token
            return true
          }
        } catch (error: any) {
          console.error('[NextAuth] Google sign in failed:', error.response?.data || error.message)
          return false
        }
      }
      return true
    },
    // Manage JWT token creation and updates
    async jwt({ token, user, account }) {
      console.log('[NextAuth] JWT callback:', { userId: user?.id, tokenId: token.id })
      
      if (user) {
        // Ensure user ID is properly set in the token
        token.id = user.id || token.id
        token.accessToken = user.accessToken || token.accessToken
      }
      if (account?.access_token) {
        token.accessToken = account.access_token
      }
      return token
    },
    // Handle session data and token synchronization
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id
        session.accessToken = token.accessToken
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

// Add PKCE helper function
function generateCodeChallenge() {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');
  return challenge;
}