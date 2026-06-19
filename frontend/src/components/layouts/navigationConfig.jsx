import { 
  LayoutDashboard,
  BookOpen,
  Briefcase,
  Building2,
  Users,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';

export const navigationLinks = {
  student: [
    { name: 'Overview Console', href: '/student', icon: LayoutDashboard },
    { name: 'Daily Logbook', href: '/student/logbook', icon: BookOpen },
    { name: 'Industry Placements', href: '/student/placements', icon: Briefcase },
  ],
  firm: [
    { name: 'Partner Dashboard', href: '/firm', icon: Building2 },
    { name: 'Applicant Roster', href: '/firm/applicants', icon: Users },
  ],
  university: [
    { name: 'Operations Registry', href: '/university', icon: GraduationCap },
    { name: 'Compliance Audits', href: '/university/audits', icon: ShieldCheck },
  ]
};