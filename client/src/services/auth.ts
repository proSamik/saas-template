import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface AuthResponse {
  id: string;
  token: string;
  expiresAt: number;
  name: string;
  email: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  name?: string;
}

export interface GoogleAuthCredentials {
  accessToken: string;
  idToken: string;
  user: {
    email: string;
    name: string;
  };
}

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Required for cookies
});

// Track refresh attempts
let refreshAttempts = 0;
const MAX_REFRESH_ATTEMPTS = 10;

// Intercept responses to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    console.log('[Auth] API Error intercepted:', { status: error.response?.status, url: originalRequest.url });

    // Check if error is due to unauthorized access (401 or 404) and request hasn't been retried
    if (!(error.response?.status === 401 || error.response?.status === 404) || originalRequest._retry) {
      console.log('[Auth] Request failed - not an auth issue or already retried');
      return Promise.reject(error);
    }

    // Check refresh attempts
    if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
      console.log('[Auth] Maximum refresh attempts reached, redirecting to login');
      window.location.href = '/auth/login';
      return Promise.reject(new Error('Maximum refresh attempts reached'));
    }

    console.log('[Auth] Attempting to refresh token...');
    originalRequest._retry = true;
    refreshAttempts++;

    try {
      // Get CSRF token from cookie
      const csrfToken = document.cookie.split('; ').find(row => row.startsWith('csrf_token='))?.split('=')[1];
      
      // Attempt to refresh the token with CSRF token
      const response = await api.post('/auth/refresh', {}, {
        headers: {
          'X-CSRF-Token': csrfToken
        }
      });
      console.log('[Auth] Token refresh successful');
      
      // Reset refresh attempts on successful refresh
      refreshAttempts = 0;
      
      // Update access token in memory
      const { token } = response.data;
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('[Auth] Updated access token in memory');
      
      // Retry original request with new token
      originalRequest.headers['Authorization'] = `Bearer ${token}`;
      console.log('[Auth] Retrying original request with new token');
      return api(originalRequest);
    } catch (refreshError) {
      console.log('[Auth] Token refresh failed, attempts:', refreshAttempts);
      if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
        console.log('[Auth] Maximum refresh attempts reached, redirecting to login');
        window.location.href = '/auth/login';
      }
      return Promise.reject(refreshError);
    }
  }
);

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('[Auth] Sending login request...');
    const response = await api.post('/auth/login', credentials);
    console.log('[Auth] Login response received');
    return response.data;
  },

  async googleLogin(credentials: GoogleAuthCredentials): Promise<AuthResponse> {
    console.log('[Auth] Sending Google login request...');
    const response = await api.post('/auth/google', credentials);
    console.log('[Auth] Google login response received');
    return response.data;
  },

  async register(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('[Auth] Sending registration request...');
    const response = await api.post('/auth/register', credentials);
    console.log('[Auth] Registration response received');
    return response.data;
  },

  async logout(): Promise<void> {
    console.log('[Auth] Sending logout request...');
    await api.post('/auth/logout');
    console.log('[Auth] Logout successful');
  },

  async refreshToken(): Promise<AuthResponse> {
    console.log('[Auth] Sending refresh token request...');
    const response = await api.post('/auth/refresh');
    console.log('[Auth] Refresh token response received');
    return response.data;
  },

  async forgotPassword(email: string): Promise<void> {
    console.log('[Auth] Sending forgot password request...');
    await api.post('/auth/forgot-password', { email });
    console.log('[Auth] Forgot password request successful');
  },

  async resetPassword(token: string, password: string): Promise<void> {
    console.log('[Auth] Sending reset password request...');
    await api.post('/auth/reset-password', { token, password });
    console.log('[Auth] Password reset successful');
  },

  setAuthHeader(token: string) {
    console.log('[Auth] Setting auth header');
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },

  async get<T = any>(url: string): Promise<T> {
    console.log(`[Auth] Sending GET request to ${url}`);
    const response = await api.get<T>(url);
    console.log(`[Auth] GET response received from ${url}`);
    return response.data;
  },

  async post(url: string, data: any) {
    console.log(`[Auth] Sending POST request to ${url}`);
    const response = await api.post(url, data);
    console.log(`[Auth] POST response received from ${url}`);
    return response;
  },

  clearAuthHeader() {
    console.log('[Auth] Clearing auth header');
    delete api.defaults.headers.common['Authorization'];
  }
};