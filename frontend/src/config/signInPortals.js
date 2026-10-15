// Single source of truth for the cross-portal sign-in links shown at the
// bottom of every auth screen. Unlike registration.js this list DOES include
// admin: signing in is not self-service, so every portal — admin included —
// must be reachable from every other portal's sign-in page. Names come from
// roleTheme.portal so the footer matches the branding used on the landing
// page, sidebar and navbar.

import roleTheme from './roleTheme';

export const signInPortals = [
  { role: 'student', name: roleTheme.student.portal, loginPath: '/login/student' },
  { role: 'firm', name: roleTheme.firm.portal, loginPath: '/login/firm' },
  { role: 'university', name: roleTheme.university.portal, loginPath: '/login/university' },
  { role: 'admin', name: roleTheme.admin.portal, loginPath: '/login/admin' },
];

export default signInPortals;
