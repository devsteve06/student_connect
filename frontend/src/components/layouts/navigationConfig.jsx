import {
  LayoutDashboard,
  BookOpen,
  Briefcase,
  Building2,
  Users,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';

// Single source of truth for sidebar navigation.
// paths must match the routes declared in src/route/AppRoute.jsx
export const navigationLinks = {
  student: [
    { name: 'Overview', href: '/student', icon: LayoutDashboard },
    { name: 'Marketplace', href: '/student/marketplace', icon: Briefcase },
    { name: 'Logbook', href: '/student/logbook', icon: BookOpen },
  ],
  firm: [
    { name: 'Overview', href: '/firm', icon: LayoutDashboard },
    { name: 'Applicants', href: '/firm/applicants', icon: Users },
  ],
  university: [
    { name: 'Overview', href: '/university', icon: LayoutDashboard },
    { name: 'Audits', href: '/university/audits', icon: ShieldCheck },
  ],
  admin: [
    { name: 'Admin overview', href: '/admin', icon: ShieldCheck },
    { name: 'Student portal', href: '/student', icon: GraduationCap, section: 'Portals' },
    { name: 'Firm portal', href: '/firm', icon: Building2 },
    { name: 'Faculty portal', href: '/university', icon: Briefcase },
  ],
};

export default navigationLinks;