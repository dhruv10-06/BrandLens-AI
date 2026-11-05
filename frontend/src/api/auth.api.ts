import api from './client.ts';
import { User } from '../types/index.ts';

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

export const authApi = {
  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/login', credentials);
    return res.data;
  },

  register: async (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    orgName?: string;
    orgSlug?: string;
  }): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/register', data);
    return res.data;
  },

  getMe: async (): Promise<{ success: boolean; user: User }> => {
    const res = await api.get<{ success: boolean; user: User }>('/auth/me');
    return res.data;
  },
};
