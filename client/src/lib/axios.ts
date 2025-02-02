// Extend AxiosRequestConfig to include _retry property
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

/**
 * Axios instance configured for the SaaS platform API
 * 
 * This module exports a configured Axios instance that:
 * - Uses the API URL from environment variables as the base URL
 * - Automatically adds JWT authentication tokens from the NextAuth session
 * - Handles request/response interceptors for authentication
 * - Includes error handling and environment validation
 */

import axios, { AxiosError } from 'axios';
import { getSession } from 'next-auth/react';
import { Session } from 'next-auth';

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
}

// Define API response types
interface TokenRefreshResponse {
  token: string;
  refreshToken: string;
}

interface APIErrorResponse {
  message: string;
  status?: number;
  code?: string;
}

// Validate API URL environment variable
if (!process.env.NEXT_PUBLIC_API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is not set');
}

// Create a token refresh promise to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to handle authentication
api.interceptors.request.use(async (config) => {
  try {
    // Get the current session from NextAuth
    const session = await getSession();
    
    if (session?.user?.accessToken) {
      config.headers.Authorization = `Bearer ${session.user.accessToken}`;
    }
    
    return config;
  } catch (error) {
    console.error('Error in request interceptor:', error);
    return Promise.reject(error);
  }
}, (error) => {
  console.error('Request interceptor error:', error);
  return Promise.reject(error);
});

// Track retry attempts for each request
const retryMap = new Map<string, number>();
const maxRetries = 3;
const backoffDelay = 1000; // Base delay in milliseconds

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Generate a unique key for the request
    const requestKey = `${originalRequest.method}-${originalRequest.url}`;
    const retryCount = retryMap.get(requestKey) || 0;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Check if the error indicates a blacklisted or invalid token
      const errorMessage = (error.response.data as APIErrorResponse)?.message || '';
      if (errorMessage.includes('revoked') || errorMessage.includes('invalid token binding')) {
        // Token is blacklisted or invalidated due to suspicious activity
        const { signOut } = await import('next-auth/react');
        await signOut({ redirect: true, callbackUrl: '/auth/login' });
        return Promise.reject(new Error('Session invalidated. Please log in again.'));
      }

      if (isRefreshing) {
        try {
          const token = await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const session = await getSession();
        if (!session?.user?.refreshToken || !session?.user?.provider) {
          throw new Error('No refresh token or provider available');
        }

        const response = await axios.post<TokenRefreshResponse>(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          {
            refreshToken: session.user.refreshToken,
            provider: session.user.provider
          },
          {
            headers: {
              'User-Agent': window.navigator.userAgent
            }
          }
        );

        const { signIn } = await import('next-auth/react');
        await signIn('credentials', {
          redirect: false,
          accessToken: response.data.token,
          refreshToken: response.data.refreshToken
        });

        originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
        processQueue(null, response.data.token);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle general request retries with exponential backoff
    // Don't retry on connection errors or when server is unreachable
    if (retryCount < maxRetries && 
        error.response?.status !== 401 && 
        error.code !== 'ERR_CONNECTION_RESET' && 
        error.code !== 'ECONNABORTED') {
      retryMap.set(requestKey, retryCount + 1);
      const delay = Math.min(backoffDelay * Math.pow(2, retryCount), 10000); // Cap at 10 seconds
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return api(originalRequest);
    }

    // Reset retry count and reject the error
    retryMap.delete(requestKey);
    return Promise.reject(error);
  }
);

export default api;