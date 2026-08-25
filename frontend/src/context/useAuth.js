// src/context/useAuth.js
// Accessor for the global session state provided by <AuthProvider>.
import { useContext } from 'react';
import AuthContext from './authContext';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default useAuth;
