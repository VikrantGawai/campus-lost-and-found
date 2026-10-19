import { createContext, useContext, useState, useCallback } from 'react';
import { isDemoMode } from '../config/firebase';
import { DEMO_USERS } from '../data/demoData';
import { USER_ROLES } from '../config/constants';

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  // In demo mode, default to first student user
  const [currentUser, setCurrentUser] = useState(
    isDemoMode ? DEMO_USERS[0] : null
  );
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    if (isDemoMode) {
      const user = DEMO_USERS.find((u) => u.email === email);
      if (user) {
        setCurrentUser(user);
        return user;
      }
      throw new Error('User not found in demo mode');
    }
    // Firebase auth would go here
    throw new Error('Firebase not configured');
  }, []);

  const logout = useCallback(async () => {
    if (isDemoMode) {
      setCurrentUser(DEMO_USERS[0]);
      return;
    }
    // Firebase signOut would go here
  }, []);

  // Demo-only: switch between demo users for testing
  const switchDemoUser = useCallback((userId) => {
    if (!isDemoMode) return;
    const user = DEMO_USERS.find((u) => u.id === userId);
    if (user) setCurrentUser(user);
  }, []);

  const isAdmin = currentUser?.role === USER_ROLES.ADMIN;
  const isVolunteer = currentUser?.role === USER_ROLES.VOLUNTEER;

  const value = {
    currentUser,
    loading,
    isDemoMode,
    isAdmin,
    isVolunteer,
    login,
    logout,
    switchDemoUser,
    demoUsers: isDemoMode ? DEMO_USERS : [],
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
