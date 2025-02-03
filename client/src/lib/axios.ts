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
 * - Handles access tokens in memory and refresh tokens via HTTP-only cookies
 * - Implements automatic token refresh with request queueing
 * - Includes robust error handling and retry mechanisms
 */

import axios, { AxiosError } from 'axios';
import useAuthStore from './store';

// Define API response types
interface TokenRefreshResponse {
  token: string;
  expiresAt: number;
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
  withCredentials: true, // Required for cookies
});

// Add request interceptor to handle authentication
api.interceptors.request.use(async (config) => {
  try {
    // Get access token from memory store
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      console.log('[API Debug] Adding auth token to request:', {
        url: config.url,
        method: config.method,
        tokenPresent: !!accessToken
      });
      config.headers.Authorization = `Bearer ${accessToken}`;
    } else {
      console.log('[API Debug] No access token found for request:', {
        url: config.url,
        method: config.method
      });
    }

    // Add CSRF token if available
    const csrfToken = document.cookie.match('(^|;)\\s*csrf_token\\s*=\\s*([^;]+)');
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken[2];
    }

    return config;
  } catch (error) {
    console.error('[API Debug] Error in request interceptor:', error);
    return Promise.reject(error);
  }
}, (error) => {
  console.error('[API Debug] Request interceptor error:', error);
  return Promise.reject(error);
});

// Track retry attempts for each request
const retryMap = new Map<string, number>();
const maxRetries = 3;
const backoffDelay = 1000; // Base delay in milliseconds
const maxBackoffDelay = 10000; // Maximum delay cap of 10 seconds

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('[API Debug] Response received:', {
      url: response.config.url,
      status: response.status,
      statusText: response.statusText
    });
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    if (!originalRequest) {
      return Promise.reject(error);
    }

    console.log('[API Debug] Response error:', {
      url: originalRequest.url,
      status: error.response?.status,
      message: error.message
    });

    // Generate a unique key for the request
    const requestKey = `${originalRequest.method}-${originalRequest.url}`;
    const retryCount = retryMap.get(requestKey) || 0;

    // Handle 401 errors and token refresh
    if (error.response?.status === 401) {
      // Check if the error indicates a blacklisted or invalid token
      const errorMessage = (error.response.data as APIErrorResponse)?.message || '';
      if (errorMessage.includes('revoked') || errorMessage.includes('invalid token binding')) {
        console.log('[API Debug] Token invalidated:', errorMessage);
        useAuthStore.getState().clearAuth();
        window.location.href = '/auth/login';
        return Promise.reject(new Error('Session invalidated. Please log in again.'));
      }

      // Only attempt token refresh if not already retrying and not in refresh process
      if (!originalRequest._retry && !isRefreshing) {
        console.log('[API Debug] Initiating token refresh');
        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const response = await axios.post<TokenRefreshResponse>(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
            {},
            {
              headers: {
                'User-Agent': window.navigator.userAgent
              },
              withCredentials: true
            }
          );

          console.log('[API Debug] Token refresh successful');
          useAuthStore.getState().setAccessToken(response.data.token);
          originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
          processQueue(null, response.data.token);
          return api(originalRequest);
        } catch (refreshError) {
          console.error('[API Debug] Token refresh failed:', refreshError);
          processQueue(refreshError as Error);
          useAuthStore.getState().clearAuth();
          window.location.href = '/auth/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
    }

    // Handle general request retries with exponential backoff
    const shouldRetry = (
      retryCount < maxRetries &&
      error.response?.status !== 401 &&
      error.response?.status !== 404 && // Don't retry not found
      error.response?.status !== 422 && // Don't retry validation errors
      !error.response?.headers['x-no-retry'] && // Check if server explicitly asks not to retry
      error.code !== 'ERR_CANCELED' // Don't retry canceled requests
    );

    if (shouldRetry) {
      retryMap.set(requestKey, retryCount + 1);
      const delay = Math.min(backoffDelay * Math.pow(2, retryCount), maxBackoffDelay);
      
      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 100;
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
      
      // Clear Authorization header on network errors to force re-fetch of token
      if (!error.response && error.code === 'ERR_NETWORK') {
        delete originalRequest.headers.Authorization;
      }
      
      return api(originalRequest);
    }

    // Reset retry count and reject the error
    retryMap.delete(requestKey);
    return Promise.reject(error);
  }
);

export default api;