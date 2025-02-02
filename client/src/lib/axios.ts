/**
 * Axios instance configured for the SaaS platform API
 * 
 * This module exports a configured Axios instance that:
 * - Uses the API URL from environment variables as the base URL
 * - Automatically adds JWT authentication tokens from the NextAuth session
 * - Handles request/response interceptors for authentication
 * - Includes error handling and environment validation
 */

import axios from 'axios';
import { getSession } from 'next-auth/react';

// Validate API URL environment variable
if (!process.env.NEXT_PUBLIC_API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is not set');
}

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
    } else {
      console.warn('No valid session token available');
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

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      // Server responded with a status code outside of 2xx range
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      // Request was made but no response received
      console.error('API No Response:', error.request);
    } else {
      // Error in request setup
      console.error('API Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;