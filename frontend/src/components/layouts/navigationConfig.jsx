import {
  LayoutDashboard,
  BookOpen,
  Briefcase,
  Building2,
  Users,
  GraduationCap,
  ShieldCheck,
  User,
} from 'lucide-react';

// Single source of truth for sidebar navigation.
// paths must match the routes declared in src/route/AppRoute.jsx
export const navigationLinks = {
  student: [
    { name: 'Overview', href: '/students', icon: LayoutDashboard },
    { name: 'Marketplace', href: '/students/marketplace', icon: Briefcase },
    { name: 'Logbook', href: '/students/logbook', icon: BookOpen },
    { name: 'Profile', href: '/students/profile', icon: User },
  ],
  firm: [
    { name: 'Overview', href: '/firms', icon: LayoutDashboard },
    { name: 'Applicants', href: '/firms/applicants', icon: Users },
  ],
  university: [
    { name: 'Overview', href: '/universities', icon: LayoutDashboard },
    { name: 'Audits', href: '/universities/audits', icon: ShieldCheck },
  ],
  admin: [
    { name: 'Admin overview', href: '/admin', icon: ShieldCheck },
    { name: 'Student portal', href: '/students', icon: GraduationCap, section: 'Portals' },
    { name: 'Firm portal', href: '/firms', icon: Building2 },
    { name: 'Faculty portal', href: '/universities', icon: Briefcase },
  ],
};

export default navigationLinks;