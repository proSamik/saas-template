import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface AuthResponse {
  id: string;
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
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Track refresh attempts and retry status
let refreshAttempts = 0;
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];
const MAX_REFRESH_ATTEMPTS = 5;

// Subscribe to token refresh
const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

// Notify subscribers about new token
const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

// Intercept responses to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    console.log('[Auth] API Error intercepted:', { status: error.response?.status, url: originalRequest.url });

    // Check if error is due to unauthorized access (401) and request hasn't been retried
    if (error.response?.status !== 401 || originalRequest._retry) {
      console.log('[Auth] Request failed - not an auth issue or already retried');
      return Promise.reject(error);
    }

    // Check refresh attempts
    if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
      console.log('[Auth] Maximum refresh attempts reached');
      return Promise.reject(new Error('Maximum refresh attempts reached'));
    }

    // If already refreshing, wait for the token
    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh((token: string) => {
          if (originalRequest.headers) {
            originalRequest.headers['X-CSRF-Token'] = token;
          }
          resolve(api(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;
    refreshAttempts++;

    try {
      // Get CSRF token from cookie
      const csrfToken = document.cookie.split('; ').find(row => row.startsWith('csrf_token='))?.split('=')[1];
      
      if (!csrfToken) {
        console.log('[Auth] No CSRF token found');
        throw new Error('No CSRF token found');
      }
      
      // Attempt to refresh the token with CSRF token
      await api.post('/auth/refresh', {}, {
        headers: {
          'X-CSRF-Token': csrfToken
        }
      });
      console.log('[Auth] Token refresh successful');
      
      // Reset refresh attempts on successful refresh
      refreshAttempts = 0;
      
      // Get updated CSRF token from cookies if present
      const newCsrfToken = document.cookie.split('; ').find(row => row.startsWith('csrf_token='))?.split('=')[1];
      if (newCsrfToken && newCsrfToken !== csrfToken) {
        console.log('[Auth] Updated CSRF token from response cookies');
        onRefreshed(newCsrfToken);
      } else {
        onRefreshed(csrfToken);
      }
      
      // Retry original request
      console.log('[Auth] Retrying original request');
      isRefreshing = false;
      return api(originalRequest);
    } catch (refreshError) {
      console.log('[Auth] Token refresh failed, attempts:', refreshAttempts);
      if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
        console.log('[Auth] Maximum refresh attempts reached, redirecting to login');
      }
      isRefreshing = false;
      return Promise.reject(refreshError);
    }
  }
);

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('[Auth] Sending login request...');
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    console.log('[Auth] Login response received');
    return response.data;
  },

  async googleLogin(code: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/google', { code });
    return response.data;
  },

  async register(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('[Auth] Sending registration request...');
    const response = await api.post<AuthResponse>('/auth/register', credentials);
    console.log('[Auth] Registration response received');
    return response.data;
  },

  async logout(): Promise<void> {
    console.log('[Auth] Sending logout request...');
    await api.post('/auth/logout');
    console.log('[Auth] Logout successful');
  },

  async forgotPassword(email: string): Promise<void> {
    console.log('[Auth] Sending forgot password request...');
    await api.post('/auth/reset-password/request', { email });
    console.log('[Auth] Forgot password request successful');
  },

  async resetPassword(token: string, password: string): Promise<void> {
    console.log('[Auth] Sending reset password request...');
    await api.post('/auth/reset-password', { token, password });
    console.log('[Auth] Password reset successful');
  },

  async AccountPasswordReset(currentPassword: string, newPassword: string): Promise<void> {
    console.log('[Auth] Sending reset password request...');
    await api.post('/auth/account-password/reset', { currentPassword, newPassword });
    console.log('[Auth] Password reset successful');
  },

  async checkRefreshToken(): Promise<any> {
    console.log('[Auth] Checking refresh token status...');
    // Get CSRF token from cookie
    const csrfToken = document.cookie.split('; ').find(row => row.startsWith('csrf_token='))?.split('=')[1];
    
    if (!csrfToken) {
      console.log('[Auth] No CSRF token found');
      throw new Error('No CSRF token found');
    }
    
    const response = await api.post('/auth/refresh', {}, {
      headers: {
        'X-CSRF-Token': csrfToken
      }
    });
    return response;
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
  }
};