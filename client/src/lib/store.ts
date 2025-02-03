import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface AuthState {
  accessToken: string | null;
  expiresAt: number | null;
  user: User | null;
  setAuth: (token: string, expiresAt: number) => void;
  setAccessToken: (token: string) => void;
  setUser: (user: User | null) => void;
  updateUser: (user: User) => void;
  clearAuth: () => void;
  isTokenExpired: () => boolean;
}

const useAuthStore = create<AuthState>()((set, get) => ({
  accessToken: null,
  expiresAt: null,
  user: null,
  setAuth: (token, expiresAt) => set({ accessToken: token, expiresAt }),
  setAccessToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),
  updateUser: (user) => set((state) => ({ user: { ...state.user, ...user } })),
  clearAuth: () => set({ accessToken: null, expiresAt: null, user: null }),
  isTokenExpired: () => {
    const state = get();
    if (!state.expiresAt) return true;
    // Add 10 second buffer for token expiration
    return Date.now() >= (state.expiresAt - 10) * 1000;
  }
}));

export default useAuthStore;