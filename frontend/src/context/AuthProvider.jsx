// src/context/AuthProvider.jsx
// Global session state for the whole app. Wraps the router in AppRoute so
// every view can read the signed-in account via useAuth() instead of poking
// at localStorage directly. All persistence still flows through sessionStore.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { authService } from '../service/authService';
import { adminService } from '../service/adminService';
import sessionStore from '../service/sessionStore';
import AuthContext from './authContext';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => sessionStore.getProfile());

  const adoptSession = useCallback((data) => {
    sessionStore.save(data);
    setUser(sessionStore.getProfile());
    return data;
  }, []);

  const login = useCallback(
    (email, password, expectedRole) =>
      authService.login(email, password, expectedRole).then(adoptSession),
    [adoptSession]
  );

  const register = useCallback(
    (payload) => authService.register(payload).then(adoptSession),
    [adoptSession]
  );

  const adminLogin = useCallback(
    (username, password) => adminService.login(username, password).then(adoptSession),
    [adoptSession]
  );

  const logout = useCallback(() => {
    authService.logout();
    adminService.logout();
    setUser(null);
  }, []);

  // Stay consistent if another tab signs in or out.
  useEffect(() => {
    const onStorage = (event) => {
      if (!event.key || event.key === 'token' || event.key === 'profile') {
        setUser(sessionStore.getProfile());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token: sessionStore.getToken(),
      isAuthenticated: Boolean(sessionStore.getToken()),
      login,
      register,
      adminLogin,
      logout,
      refreshUser: () => setUser(sessionStore.getProfile())
    }),
    [user, login, register, adminLogin, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
