import axios from 'axios';
import useAuthStore from './store';

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  id: string;
  token: string;
  expiresAt: number;
  name: string;
  email: string;
  image?: string | null;
  provider?: string;
  refreshToken?: string;
}

interface GoogleAuthParams {
  access_token: string;
  id_token: string;
  user: {
    email: string;
    name: string;
    image?: string | null;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

class AuthService {
  static async login(credentials: LoginCredentials): Promise<void> {
    try {
      const response = await axios.post<AuthResponse>(
        `${API_URL}/auth/login`,
        credentials,
        { 
          withCredentials: true,
          headers: {
            'User-Agent': typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
          }
        }
      );

      const { token, expiresAt, id, name, email, image } = response.data;
      useAuthStore.getState().setAuth(token, expiresAt);
      useAuthStore.getState().setUser({ id, name, email, image: image || undefined });
      useAuthStore.getState().setAccessToken(token);
    } catch (error: any) {
      console.error('[Auth] Login failed:', error.response?.data || error);
      throw new Error(error.response?.data?.message || 'Authentication failed');
    }
  }

  static async loginWithGoogle(params: GoogleAuthParams): Promise<void> {
    try {
      const response = await axios.post<AuthResponse>(
        `${API_URL}/auth/google`,
        params,
        {
          withCredentials: true,
          headers: {
            'User-Agent': window.navigator.userAgent
          }
        }
      );

      const { token, expiresAt, id, name, email, image } = response.data;
      useAuthStore.getState().setAuth(token, expiresAt);
      useAuthStore.getState().setUser({ id, name, email, image: image || undefined });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Google authentication failed');
    }
  }

  static async refreshToken(): Promise<void> {
    try {
      const response = await axios.post<AuthResponse>(
        `${API_URL}/auth/refresh`,
        {},
        { 
          withCredentials: true,
          headers: {
            'User-Agent': typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
          }
        }
      );

      const { token, expiresAt } = response.data;
      useAuthStore.getState().setAuth(token, expiresAt);
      useAuthStore.getState().setAccessToken(token);

      console.log('[Auth] Token refreshed successfully');
    } catch (error: any) {
      console.error('[Auth] Token refresh failed:', error.response?.data || error);
      useAuthStore.getState().clearAuth();
      throw new Error(error.response?.data?.message || 'Token refresh failed');
    }
  }

  static async logout(): Promise<void> {
    try {
      await axios.post(
        `${API_URL}/auth/logout`,
        {},
        { withCredentials: true }
      );
    } finally {
      useAuthStore.getState().clearAuth();
    }
  }

  static isAuthenticated(): boolean {
    const store = useAuthStore.getState();
    return !!store.accessToken && !store.isTokenExpired();
  }
}

export default AuthService;