import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { JWT } from 'next-auth/jwt';
import { AuthResponse, AuthUser } from '@/types/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

async function refreshToken(token: JWT): Promise<JWT> {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // This is important for cookies
    });

    if (!response.ok) throw new Error('Failed to refresh token');

    const refreshedTokens = await response.json();

    return {
      ...token,
      accessToken: refreshedTokens.token,
      expiresAt: refreshedTokens.expiresAt,
    };
  } catch (error) {
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials): Promise<AuthUser | null> {
        if (!credentials?.email || !credentials?.password) return null;
        
        try {
          const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
            credentials: 'include',
          });

          if (!response.ok) return null;

          const authResponse: AuthResponse = await response.json();
          return authResponse.user;
        } catch (error) {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // This will only be executed at login
        return {
          ...token,
          accessToken: user.token,
          expiresAt: user.expiresAt,
          id: user.id,
          email: user.email,
          name: user.name,
        };
      }

      // On subsequent calls, check if the token needs to be refreshed
      if (Date.now() < (token.expiresAt as number * 1000)) {
        return token;
      }

      // Token has expired, try to refresh it
      return await refreshToken(token);
    },
    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id as string,
        accessToken: token.accessToken as string,
        error: token.error as string | undefined,
      };
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: 'jwt',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };