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
  image?: string;
}

interface GoogleAuthParams {
  access_token: string;
  id_token: string;
  user: {
    email: string;
    name: string;
    image?: string;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

class AuthService {
  static async login(credentials: LoginCredentials): Promise<void> {
    try {
      const response = await axios.post<AuthResponse>(
        `${API_URL}/auth/login`,
        credentials,
        { withCredentials: true }
      );

      const { token, expiresAt, id, name, email, image } = response.data;
      useAuthStore.getState().setAuth(token, expiresAt);
      useAuthStore.getState().setUser({ id, name, email, image });
    } catch (error: any) {
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
      useAuthStore.getState().setUser({ id, name, email, image });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Google authentication failed');
    }
  }

  static async refreshToken(): Promise<void> {
    try {
      const response = await axios.post<AuthResponse>(
        `${API_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );

      const { token, expiresAt } = response.data;
      useAuthStore.getState().setAuth(token, expiresAt);
    } catch (error) {
      useAuthStore.getState().clearAuth();
      throw error;
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