// Single source of truth for self-service account creation.
//
// Only students, firms and universities can sign themselves up — admins are
// provisioned by another admin, so 'admin' is intentionally absent from this
// list and is filtered out of the picker. Every entry pairs the signup route
// with the portal's sign-in route so the auth screens can cross-link without
// hard-coding paths.

export const REGISTRABLE_ROLES = ['student', 'firm', 'university'];

export const registrationRoles = {
  student: {
    role: 'student',
    label: 'Student',
    portal: 'Student Hub',
    headline: 'Launch your industrial attachment journey.',
    tagline:
      'Browse placements, submit weekly logbook entries, and track your progress in one place.',
    quote: 'Student Connect connected me with a placement that matched exactly what I wanted to learn this year.',
    quoteSource: 'Class of 2026 · Placement story',
    title: 'Create your student account',
    subtitle: 'A few details to get you started on your placement journey.',
    cta: 'Create account',
    loginPath: '/login/student',
    registerPath: '/register/student',
    homePath: '/student',
    accent: {
      link: 'text-brand-700 hover:text-brand-800',
      focus: 'focus:border-brand-500 focus:ring-brand-500/10',
    },
  },
  firm: {
    role: 'firm',
    label: 'Firm',
    portal: 'Corporate Gate',
    headline: 'Find your next great placement talent.',
    tagline: 'Review vetted candidates, manage applications, and keep every opening moving.',
    quote: 'We shortlisted three interns within a week of posting and placed two by month end.',
    quoteSource: 'Nexus Labs · Partner story',
    title: 'Create a partner account',
    subtitle: 'Join the network and start receiving student applications.',
    cta: 'Create account',
    loginPath: '/login/firm',
    registerPath: '/register/firm',
    homePath: '/firm',
    accent: {
      link: 'text-amber-700 hover:text-amber-800',
      focus: 'focus:border-amber-500 focus:ring-amber-500/10',
    },
  },
  university: {
    role: 'university',
    label: 'University',
    portal: 'Faculty Console',
    headline: 'Oversee every placement, from start to sign-off.',
    tagline:
      'Track student attachments, verify logbooks, and monitor placement progress across your institution.',
    quote: 'The audit queue gives us a clear view of every pending logbook before the semester closes.',
    quoteSource: 'Strathmore Administrative Registry',
    title: 'Create a staff account',
    subtitle: 'Request clearances for your faculty or department.',
    cta: 'Create account',
    loginPath: '/login/university',
    registerPath: '/register/university',
    homePath: '/university',
    accent: {
      link: 'text-cyan-700 hover:text-cyan-800',
      focus: 'focus:border-cyan-500 focus:ring-cyan-500/10',
    },
  },
};

// Admin accounts are never self-served, so the picker never offers one.
export const registrableRoleList = REGISTRABLE_ROLES.map((role) => registrationRoles[role]);

export const isRegistrableRole = (role) => REGISTRABLE_ROLES.includes(role);

export default registrationRoles;
