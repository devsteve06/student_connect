// Single source of truth for per-role visual identity.
// Every portal derives its accent styles from here so the four
// dashboards stay consistent even as branding evolves.

const roleTheme = {
  student: {
    label: 'Student',
    portal: 'Student Hub',
    breadcrumb: 'Student portal',
    // Primary accents
    text: 'text-violet-700',
    textStrong: 'text-violet-900',
    softBg: 'bg-violet-50',
    border: 'border-violet-200',
    solidBg: 'bg-violet-600',
    icon: 'text-violet-600',
    // Nav active state
    navActive: 'bg-violet-50 text-violet-900 border-violet-200',
    navHover: 'hover:bg-violet-50/70 hover:text-violet-900',
    navDot: 'bg-violet-500',
  },
  firm: {
    label: 'Firm',
    portal: 'Corporate Gate',
    breadcrumb: 'Firm portal',
    text: 'text-amber-700',
    textStrong: 'text-amber-900',
    softBg: 'bg-amber-50',
    border: 'border-amber-200',
    solidBg: 'bg-amber-600',
    icon: 'text-amber-600',
    navActive: 'bg-amber-50 text-amber-900 border-amber-200',
    navHover: 'hover:bg-amber-50/70 hover:text-amber-900',
    navDot: 'bg-amber-500',
  },
  university: {
    label: 'University',
    portal: 'Faculty Console',
    breadcrumb: 'University portal',
    text: 'text-cyan-700',
    textStrong: 'text-cyan-900',
    softBg: 'bg-cyan-50',
    border: 'border-cyan-200',
    solidBg: 'bg-cyan-600',
    icon: 'text-cyan-600',
    navActive: 'bg-cyan-50 text-cyan-900 border-cyan-200',
    navHover: 'hover:bg-cyan-50/70 hover:text-cyan-900',
    navDot: 'bg-cyan-500',
  },
  admin: {
    label: 'Admin',
    portal: 'Admin Center',
    breadcrumb: 'Administration',
    text: 'text-rose-700',
    textStrong: 'text-rose-900',
    softBg: 'bg-rose-50',
    border: 'border-rose-200',
    solidBg: 'bg-rose-600',
    icon: 'text-rose-600',
    navActive: 'bg-rose-50 text-rose-900 border-rose-200',
    navHover: 'hover:bg-rose-50/70 hover:text-rose-900',
    navDot: 'bg-rose-500',
  },
};

// Accent chips used for banner-eyebrow labels on each dashboard.
export function roleChip(role) {
  const t = roleTheme[role] || roleTheme.student;
  return {
    label: t.portal,
    classes: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${t.softBg} ${t.text} border ${t.border}`,
  };
}

export default roleTheme;