import { Session, User } from 'next-auth';

export interface AuthUser extends User {
  id: string;
  email: string;
  name: string;
  accessToken: string;
  token: string;
  expiresAt: number;
}

export interface CustomSession extends Session {
  user: AuthUser & {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  error?: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface GoogleAuthRequest {
  code: string;
}

export interface AccountPasswordResetRequest {
  currentPassword: string;
  newPassword: string;
}

export interface RequestPasswordResetRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}