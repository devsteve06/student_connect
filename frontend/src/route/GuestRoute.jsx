// src/route/GuestRoute.jsx
// Wraps sign-in screens. Anyone who already holds a valid session is sent
// straight to their portal home instead of seeing the login form again.
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const PORTAL_HOMES = {
  student: '/student',
  firm: '/firm',
  university: '/university',
  admin: '/admin'
};

export default function GuestRoute({ children }) {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user?.role && PORTAL_HOMES[user.role]) {
    return <Navigate to={PORTAL_HOMES[user.role]} replace />;
  }

  return children;
}
