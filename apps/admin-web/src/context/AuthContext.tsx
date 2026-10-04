import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { IUser, UserRole, IDataScope, ISession, DataScopeLevel } from '@nirikshan/shared-types';

interface AuthContextType {
  user: IUser | null;
  roles: UserRole[];
  permissions: string[];
  scope: IDataScope | null;
  authToken: string;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole | string) => boolean;
  activeSessions: any[];
  fetchSessions: () => Promise<void>;
  revokeSession: (sessionId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [scope, setScope] = useState<IDataScope | null>(null);
  const [authToken, setAuthToken] = useState<string>(() => localStorage.getItem('nirikshan_token') || '');
  const [refreshToken, setRefreshToken] = useState<string>(() => localStorage.getItem('nirikshan_refresh_token') || '');
  const [loading, setLoading] = useState<boolean>(true);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);

  // Verify session on startup via GET /api/v1/auth/me
  useEffect(() => {
    const verifyIdentity = async () => {
      if (!authToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/v1/auth/me', {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setUser(json.data.user);
            setRoles(json.data.roles || [json.data.user.role]);
            setPermissions(json.data.permissions || []);
            setScope(json.data.scope || { level: DataScopeLevel.NATIONAL });
          } else {
            handleLocalLogout();
          }
        } else {
          // Token expired or invalid
          handleLocalLogout();
        }
      } catch (err) {
        console.error('Failed to verify identity on boot:', err);
        handleLocalLogout();
      } finally {
        setLoading(false);
      }
    };

    verifyIdentity();
  }, [authToken]);

  const handleLocalLogout = () => {
    setUser(null);
    setRoles([]);
    setPermissions([]);
    setScope(null);
    setAuthToken('');
    setRefreshToken('');
    localStorage.removeItem('nirikshan_token');
    localStorage.removeItem('nirikshan_refresh_token');
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || data.message || 'Authentication failed');
      }

      const token = data.data.tokens.accessToken;
      const refToken = data.data.tokens.refreshToken;

      localStorage.setItem('nirikshan_token', token);
      localStorage.setItem('nirikshan_refresh_token', refToken);

      setAuthToken(token);
      setRefreshToken(refToken);
      setUser(data.data.user);
      setRoles(data.data.roles || [data.data.user.role]);
      setPermissions(data.data.permissions || []);
      setScope(data.data.scope || { level: DataScopeLevel.NATIONAL });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (authToken) {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (e) {
      console.warn('Logout network notice:', e);
    } finally {
      handleLocalLogout();
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!permissions || permissions.length === 0) return false;
    return permissions.includes(permission);
  };

  const hasRole = (role: UserRole | string): boolean => {
    if (!roles || roles.length === 0) return false;
    return roles.some((r) => r.toString() === role.toString());
  };

  const fetchSessions = async () => {
    if (!authToken) return;
    try {
      const res = await fetch('/api/v1/auth/sessions', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setActiveSessions(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load active sessions:', err);
    }
  };

  const revokeSession = async (sessionId: string) => {
    if (!authToken) return;
    try {
      await fetch(`/api/v1/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      await fetchSessions();
    } catch (err) {
      console.error('Failed to revoke session:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        roles,
        permissions,
        scope,
        authToken,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        hasPermission,
        hasRole,
        activeSessions,
        fetchSessions,
        revokeSession,
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
