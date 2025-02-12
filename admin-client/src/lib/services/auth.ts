import { API_URL } from '@/lib/config';

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  token: string;
}

let isLoggingIn = false;

export const adminLogin = async (credentials: AdminLoginRequest): Promise<AdminLoginResponse> => {
  if (isLoggingIn) {
    throw new Error('Login request already in progress');
  }

  try {
    isLoggingIn = true;
    const response = await fetch(`${API_URL}/admin/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return response.json();
  } finally {
    isLoggingIn = false;
  }
};

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('admin_token', token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem('admin_token');
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
}; 