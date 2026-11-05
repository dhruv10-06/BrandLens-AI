import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/index.ts';
import { authApi } from '../api/auth.api.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    orgName?: string;
    orgSlug?: string;
  }) => Promise<void>;
  logout: () => void;
  quickDemoLogin: (role: 'creator' | 'reviewer') => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('brandlens_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('brandlens_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('brandlens_token');
      if (storedToken) {
        try {
          const res = await authApi.getMe();
          setUser(res.user);
          localStorage.setItem('brandlens_user', JSON.stringify(res.user));
        } catch (err) {
          console.warn('[AuthContext] Session invalid or expired.');
          localStorage.removeItem('brandlens_token');
          localStorage.removeItem('brandlens_user');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    localStorage.setItem('brandlens_token', res.token);
    localStorage.setItem('brandlens_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    orgName?: string;
    orgSlug?: string;
  }) => {
    const res = await authApi.register(data);
    localStorage.setItem('brandlens_token', res.token);
    localStorage.setItem('brandlens_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('brandlens_token');
    localStorage.removeItem('brandlens_user');
    setToken(null);
    setUser(null);
  };

  const quickDemoLogin = async (role: 'creator' | 'reviewer') => {
    const email = role === 'creator' ? 'creator@brandlens.demo' : 'reviewer@brandlens.demo';
    const password = role === 'creator' ? 'DemoCreator123!' : 'DemoReviewer123!';
    await login(email, password);
  };

  const refreshUser = async () => {
    try {
      const res = await authApi.getMe();
      setUser(res.user);
      localStorage.setItem('brandlens_user', JSON.stringify(res.user));
    } catch (err) {
      console.warn('Failed to refresh user profile');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        quickDemoLogin,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
