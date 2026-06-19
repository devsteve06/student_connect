import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import AssetPlaceholder from '../common/assetPlaceholder';

export default function DashboardLayout({ children, role = 'student' }) {
  const location = useLocation();
  const navigate = useNavigate();

  const navConfigurations = {
  student: {
  title: "Student Hub",
  color: "text-emerald-500",
  bgHover: "hover:bg-emerald-50/60 hover:text-emerald-900",
  activeClass: "bg-emerald-50 text-emerald-900 border-emerald-200 font-bold",
  links: [
    { label: 'Overview Console', path: '/student' },
    { label: 'Attachment Marketplace', path: '/student/marketplace' },
    { label: 'Weekly Logbook System', path: '/student/logbook' } // <-- PATCHED ENTRY POINT
  ]
},
    firm: {
      title: "Corporate Gate",
      color: "text-amber-500",
      bgHover: "hover:bg-amber-50/60 hover:text-amber-900",
      activeClass: "bg-amber-50 text-amber-900 border-amber-200 font-bold",
      links: [
        { label: 'Corporate Overview', path: '/firm' },
        { label: 'Applicant Roster', path: '/firm/applicants' }
      ]
    },
    university: {
      title: "Faculty Console",
      color: "text-indigo-500",
      bgHover: "hover:bg-indigo-50/60 hover:text-indigo-900",
      activeClass: "bg-indigo-50 text-indigo-900 border-indigo-200 font-bold",
      links: [
        { label: 'Registry Central', path: '/university' },
        { label: 'Compliance Audits', path: '/university/audits' }
      ]
    },
    admin: {
      title: "Root Control Plane",
      color: "text-rose-500",
      bgHover: "hover:bg-rose-50/60 hover:text-rose-900",
      activeClass: "bg-rose-50 text-rose-900 border-rose-200 font-bold",
      links: [
        { label: 'Control Center', path: '/admin' },
        { label: 'Student Portal', path: '/student' },
        { label: 'Corporate Portal', path: '/firm' },
        { label: 'Faculty Portal', path: '/university' }
      ]
    }
  };

  const currentConfig = navConfigurations[role] || navConfigurations.student;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
      
      {/* PERSISTENT RUNTIME SIDEBAR */}
      <aside className="w-64 bg-slate-950 border-r border-slate-900 flex flex-col justify-between fixed h-full z-30">
        <div className="p-6 space-y-8">
          
          {/* Logo Frame */}
          <div className="flex items-center gap-3 border-b border-slate-900 pb-5">
            <div className="h-7 w-7 rounded-lg bg-white text-slate-950 flex items-center justify-center font-mono font-black text-xs shadow-inner">
              S
            </div>
            <div>
              <span className="font-extrabold text-white tracking-tight block text-sm">SAP System</span>
              <span className={`text-[9px] font-bold uppercase tracking-widest block ${currentConfig.color}`}>{currentConfig.title}</span>
            </div>
          </div>

          {/* Navigation Matrix Link Group */}
          <nav className="space-y-1">
            {currentConfig.links.map((link, index) => {
              const isActive = location.pathname === link.path;
              return (
                <NavLink
                  key={index}
                  to={link.path}
                  className={`flex items-center px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide border border-transparent transition-all duration-150 ${
                    isActive ? currentConfig.activeClass : `text-slate-400 ${currentConfig.bgHover}`
                  }`}
                >
                  {link.label}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Identity / Escape Footnote */}
        <div className="p-4 border-t border-slate-900 bg-slate-950/60">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/50 border border-slate-900">
            <AssetPlaceholder type="avatar" name="User Identity" className="h-8 w-8 text-[10px] text-slate-300" />
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-bold text-slate-200 truncate">Vetted Session</span>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('admin');
                  navigate(role === 'admin' ? '/login/admin' : '/');
                }}
                className="block text-[10px] text-slate-500 font-bold hover:text-rose-400 transition-colors uppercase tracking-wider mt-0.5"
              >
                Terminate Session
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* VIEWPORT CONTROLLER BASE CONTAINER */}
      <main className="flex-1 pl-64 min-h-screen flex flex-col">
        <div className="p-8 sm:p-12 flex-1 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>

    </div>
  );
}