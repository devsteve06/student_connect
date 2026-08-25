// src/context/authContext.js
// Raw React context instance, isolated in its own module so AuthProvider.jsx
// can export a pure component and useAuth.js can export a pure hook
// (required for fast refresh / react-refresh lint compliance).
import { createContext } from 'react';

const AuthContext = createContext(null);

export default AuthContext;
