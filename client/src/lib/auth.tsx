import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

export type BusinessStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';

export interface User {
  id: string;
  email: string;
  name: string;
  isPlatformAdmin?: boolean;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  status: BusinessStatus;
  accentColor?: string;
  logoUrl?: string | null;
}

interface AuthContextType {
  user: User | null;
  business: Business | null;
  role: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    name: string;
    businessName: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = async () => {
    try {
      const data = await api.get<{
        user: User;
        business: Business;
        role: string;
      }>('/auth/me');
      setUser(data.user);
      setBusiness(data.business);
      setRole(data.role);
    } catch {
      setUser(null);
      setBusiness(null);
      setRole(null);
    }
  };

  // Check current session on mount
  useEffect(() => {
    async function checkAuth() {
      setIsLoading(true);
      await refreshSession();
      setIsLoading(false);
    }

    checkAuth();
  }, []);

  const login = async (input: { email: string; password: string }) => {
    const data = await api.post<{
      user: User;
      business: Business;
      role: string;
    }>('/auth/login', input);
    setUser(data.user);
    setBusiness(data.business);
    setRole(data.role);
  };

  const register = async (input: {
    email: string;
    password: string;
    name: string;
    businessName: string;
  }) => {
    const data = await api.post<{
      user: User;
      business: Business;
      role: string;
    }>('/auth/register', input);
    setUser(data.user);
    setBusiness(data.business);
    setRole(data.role);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
      setBusiness(null);
      setRole(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        business,
        role,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
