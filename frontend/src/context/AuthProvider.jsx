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
  // Admin cross-portal preview ("view as"): the account an admin is looking at
  // while still holding the admin session.
  const [preview, setPreview] = useState(() => sessionStore.getPreview());

  const adoptSession = useCallback((data) => {
    sessionStore.save(data);
    // Signing in always starts clean — never inherit a previous preview.
    sessionStore.clearPreview();
    setPreview(null);
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
    setPreview(null);
    setUser(null);
  }, []);

  // --- Admin preview ("view as") -------------------------------------------
  // startPreview names a student/firm/university account for the admin to
  // browse; stopPreview returns them to the admin surface.
  const startPreview = useCallback((account) => {
    const target = { role: account.role, id: account.id, name: account.name };
    sessionStore.savePreview(target);
    setPreview(target);
    return target;
  }, []);

  const stopPreview = useCallback(() => {
    sessionStore.clearPreview();
    setPreview(null);
  }, []);

  // Stay consistent if another tab signs in or out.
  useEffect(() => {
    const onStorage = (event) => {
      if (!event.key || event.key === 'token' || event.key === 'profile' || event.key === 'preview') {
        setUser(sessionStore.getProfile());
        setPreview(sessionStore.getPreview());
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
      preview,
      login,
      register,
      adminLogin,
      logout,
      startPreview,
      stopPreview,
      refreshUser: () => setUser(sessionStore.getProfile())
    }),
    [user, preview, login, register, adminLogin, logout, startPreview, stopPreview]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
