import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentSessionUser, loginMock, logoutMock } from '@/services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const sessionUser = await getCurrentSessionUser();
        setUser(sessionUser);
      } catch (err) {
        console.error('Failed to load session:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, []);

  async function login(email, role) {
    const loggedUser = await loginMock({ email, role });
    setUser(loggedUser);
    return loggedUser;
  }

  async function logout() {
    await logoutMock();
    setUser(null);
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
