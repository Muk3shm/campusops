import { createContext, useContext, useState, useEffect } from 'react';
import {
  getCurrentCognitoSession,
  loginCognito,
  logoutCognito,
  completeNewPasswordChallenge,
} from '@/services/cognito';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const sessionData = await getCurrentCognitoSession();
        if (sessionData && sessionData.user) {
          setUser(sessionData.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to restore Cognito session:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, []);

  async function login(email, password) {
    const result = await loginCognito(email, password);
    if (result.status === 'SUCCESS') {
      setUser(result.user);
      return result.user;
    }
    // Return challenge result for NEW_PASSWORD_REQUIRED
    return result;
  }

  async function completePasswordChallenge(cognitoUser, newPassword, userAttributes) {
    const result = await completeNewPasswordChallenge(cognitoUser, newPassword, userAttributes);
    if (result.status === 'SUCCESS') {
      setUser(result.user);
      return result.user;
    }
    return result;
  }

  async function logout() {
    logoutCognito();
    setUser(null);
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    completePasswordChallenge,
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
