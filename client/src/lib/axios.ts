/**
 * Axios instance configured for the SaaS platform API
 * 
 * This module exports a configured Axios instance that:
 * - Uses the API URL from environment variables as the base URL
 * - Automatically adds JWT authentication tokens from the NextAuth session
 * - Handles request/response interceptors for authentication
 * 
 * The instance automatically adds the Bearer token from the NextAuth session
 * to all outgoing requests via an interceptor. This ensures authenticated 
 * requests to protected API endpoints.
 */

import axios from 'axios';
import { getSession } from 'next-auth/react';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Add request interceptor to add auth token
api.interceptors.request.use(async (config) => {
  const session = await getSession();
  
  // @ts-ignore - accessToken is added in our NextAuth configuration
  if (session?.accessToken) {
    // Use the JWT token from the session
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;