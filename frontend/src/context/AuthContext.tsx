import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface AuthUser {
  role: 'admin' | 'writer';
  id?: string;
  name?: string;
  phone?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (token: string, user: AuthUser, extras?: { writerPayload?: unknown }) => void;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isWriter: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function clearAuthStorage() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('adminToken');
  localStorage.removeItem('writer');
  localStorage.removeItem('isAdminLoggedIn');
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token') || localStorage.getItem('adminToken');
    const storedUser = localStorage.getItem('user');
    const storedWriter = localStorage.getItem('writer');

    try {
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else if (storedWriter) {
        // Migrate legacy writer-only session into unified auth
        const parsed = JSON.parse(storedWriter);
        if (parsed?.token) {
          const writerInfo = parsed.writer || parsed;
          const migratedUser: AuthUser = {
            role: 'writer',
            id: writerInfo?.id != null ? String(writerInfo.id) : undefined,
            name: writerInfo?.name,
            phone: writerInfo?.phone,
          };
          localStorage.setItem('token', parsed.token);
          localStorage.setItem('user', JSON.stringify(migratedUser));
          setToken(parsed.token);
          setUser(migratedUser);
        }
      }
    } catch (e) {
      console.error('Failed to restore auth session', e);
      clearAuthStorage();
    }

    setIsLoading(false);
  }, []);

  const login = useCallback((newToken: string, newUser: AuthUser, extras?: { writerPayload?: unknown }) => {
    clearAuthStorage();
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));

    if (newUser.role === 'writer' && extras?.writerPayload) {
      localStorage.setItem('writer', JSON.stringify(extras.writerPayload));
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    clearAuthStorage();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isLoading,
        isAuthenticated: !!token,
        isAdmin: !!token && user?.role === 'admin',
        isWriter: !!token && user?.role === 'writer',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
