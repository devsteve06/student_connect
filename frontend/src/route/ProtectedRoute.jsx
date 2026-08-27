// src/route/ProtectedRoute.jsx
// Gate for authenticated areas. Unauthenticated visitors are redirected to
// the portal's sign-in screen (remembering where they wanted to go), and
// accounts from a different portal are bounced to their own home so a firm
// login can never browse /student.
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const LOGIN_ROUTES = {
  student: '/login/student',
  firm: '/login/firm',
  university: '/login/university',
  admin: '/login/admin'
};

const PORTAL_HOMES = {
  student: '/student',
  firm: '/firm',
  university: '/university',
  admin: '/admin'
};

export default function ProtectedRoute({ role, children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    const loginPath = LOGIN_ROUTES[role] || '/login/student';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={PORTAL_HOMES[user.role] || '/'} replace />;
  }

  return children;
}
