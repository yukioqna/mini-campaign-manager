import { create } from 'zustand';
import { authApi } from '../api/client';

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password });
    set({ token: data.token, user: data.user, isAuthenticated: true });
  },

  register: async (email: string, password: string, name: string) => {
    const { data } = await authApi.register({ email, password, name });
    set({ token: data.token, user: data.user, isAuthenticated: true });
  },

  logout: () => {
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
