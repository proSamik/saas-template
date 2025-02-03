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

// Intercept responses to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    console.log('[Auth] API Error intercepted:', { status: error.response?.status, url: originalRequest.url });

    // If error is not 401 or request has already been retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      console.log('[Auth] Request failed - not a token issue or already retried');
      return Promise.reject(error);
    }

    console.log('[Auth] Attempting to refresh token...');
    originalRequest._retry = true;

    try {
      // Attempt to refresh the token
      const response = await api.post('/auth/refresh');
      console.log('[Auth] Token refresh successful');
      
      // Update access token in memory
      const { Token } = response.data;
      console.log('[Auth] Updated access token in memory');
      
      // Retry original request with new token
      originalRequest.headers['Authorization'] = `Bearer ${Token}`;
      console.log('[Auth] Retrying original request with new token');
      return api(originalRequest);
    } catch (refreshError) {
      console.log('[Auth] Token refresh failed, redirecting to login');
      // Handle refresh failure - clear tokens and redirect to login
      window.location.href = '/auth/login';
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

  clearAuthHeader() {
    console.log('[Auth] Clearing auth header');
    delete api.defaults.headers.common['Authorization'];
  }
};