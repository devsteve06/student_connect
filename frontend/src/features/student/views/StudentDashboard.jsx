import  { useState, useMemo } from 'react';
import Button from '../../../components/common/Button';

export default function StudentDashboard() {
  const [selectedTerm, setSelectedTerm] = useState('May-Aug 2026');

  // 1. Core Mock Datasets for Student Persona Metrics
  const placementApplications = [
    { id: 'app-01', firm: 'Apex Cloud Labs', role: 'Cloud Architecture Intern', status: 'Interviewing', date: 'Applied 4 days ago', match: 98 },
    { id: 'app-02', firm: 'Quantum Systems', role: 'Backend Systems Engineer', status: 'Pending Review', date: 'Applied 1 week ago', match: 94 },
    { id: 'app-03', firm: 'Neural Corp AI', role: 'AI / ML Research Intern', status: 'Offer Extended', date: 'Updated 2 hours ago', match: 91 }
  ];

  const recentLogs = [
    { week: 2, range: 'May 18 - May 22', status: 'Pending Review', activities: 'Patched critical database edge pools and optimized standard query payloads.' },
    { week: 1, range: 'May 11 - May 15', status: 'Approved', activities: 'Completed corporate onboarding and configured local Kubernetes development pods.' }
  ];

  // 2. Computed Live High-Density Metrics
  const summaryMetrics = useMemo(() => {
    return {
      activeApplications: placementApplications.length,
      loggedWeeks: recentLogs.length,
      targetWeeks: 12,
      highestMatch: Math.max(...placementApplications.map(a => a.match)),
      completionPercentage: Math.round((recentLogs.filter(l => l.status === 'Approved').length / 12) * 100)
    };
  }, [placementApplications, recentLogs]);

  return (
    <div className="space-y-8">
      
      {/* MODULE 1: PLATFORM HEADER & GLOBAL EXPORT CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-100 font-mono">
            Student Core Console / Node 2026
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-2">Industrial Placement Workspace</h1>
        </div>
        <div className="flex items-center gap-3 self-start md:self-center">
          <select 
            value={selectedTerm} 
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="h-10 px-3 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
          >
            <option value="May-Aug 2026">May - Aug 2026</option>
            <option value="Jan-Apr 2026">Jan - Apr 2026</option>
          </select>
          <Button variant="secondary" className="h-10 px-4 rounded-xl text-xs font-bold border-slate-200 flex items-center gap-1.5">
            📥 Export Brief .CSV
          </Button>
        </div>
      </div>

      {/* MODULE 2: STUDENT PROFILE BENTO METRIC GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Active Submissions</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{summaryMetrics.activeApplications}</span>
            <span className="text-xs font-bold text-slate-400 font-mono">Firms</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between space-y-4 border-l-2 border-l-emerald-600">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider font-mono">Logbook Progression</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{summaryMetrics.loggedWeeks}/{summaryMetrics.targetWeeks}</span>
            <span className="text-xs font-bold text-emerald-500 font-mono">Weeks Captured</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider font-mono">Peak Target Affinity</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{summaryMetrics.highestMatch}%</span>
            <span className="text-xs font-bold text-amber-500 font-mono">AI Match Fit</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between space-y-4 bg-slate-950 text-white">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Credit Audit Status</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black tracking-tight text-emerald-400 font-mono">{summaryMetrics.completionPercentage}%</span>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Validated Hours</span>
          </div>
        </div>
      </div>

      {/* MODULE 3: PIPELINE TRACKING & LOGBOOK OVERVIEW BENTO LAYER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Marketplace Applications Pipeline (2/3 Width) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <div>
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider font-mono block">Submission Funnel</span>
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">Active Attachment Applications</h2>
            </div>
            <span className="text-[10px] font-mono bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded text-slate-500 font-bold">
              Sync Active
            </span>
          </div>

          <div className="divide-y divide-slate-50">
            {placementApplications.map((app, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0 hover:bg-slate-50/40 px-1 rounded-lg transition-all">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{app.firm}</span>
                    <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${
                      app.status === 'Offer Extended' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 animate-pulse' :
                      app.status === 'Interviewing' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-semibold font-mono">{app.role} — <span className="text-slate-400 font-normal">{app.date}</span></p>
                </div>
                
                <div className="text-right shrink-0">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono font-mono">Match Score</span>
                  <span className="text-xs font-black text-slate-900 font-mono bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                    {app.match}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Industrial Competencies Checklist (1/3 Width) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono block">Acquisition Vectors</span>
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">Skill Target Trackers</h2>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
              Core
            </span>
          </div>

          <div className="space-y-4">
            {[
              { framework: 'Containerization (Docker)', items: 3, goal: 4, color: 'bg-emerald-600' },
              { framework: 'CI/CD Engine Pipelines', items: 1, goal: 3, color: 'bg-slate-900' },
              { framework: 'Database Index Optimization', items: 2, goal: 2, color: 'bg-amber-500' }
            ].map((skill, idx) => {
              const skillPercentage = (skill.items / skill.goal) * 100;
              const isMet = skill.items === skill.goal;

              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 truncate max-w-[150px]">{skill.framework}</span>
                    <span className="font-mono text-[11px] font-bold text-slate-500 shrink-0">
                      <span className={isMet ? 'text-emerald-600 font-black' : 'text-slate-900'}>{skill.items}</span>/{skill.goal}
                    </span>
                  </div>
                  
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden relative border border-slate-200/20">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${skill.color}`} 
                      style={{ width: `${skillPercentage}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* MODULE 4: DYNAMIC RECENT LOGBOOK LEDGER FEED */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-50 pb-3">
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono block">Log Matrix History</span>
            <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">Recent Weekly Submissions</h2>
          </div>
          <a href="/student/logbook" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline underline-offset-4">
            Open Full Ledger
          </a>
        </div>

        <div className="space-y-3">
          {recentLogs.map((log) => (
            <div key={log.week} className="border border-slate-50 bg-slate-50/30 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                  W{log.week}
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 font-mono">{log.range}, 2026</span>
                  <p className="text-xs font-medium text-slate-600 max-w-2xl mt-0.5 line-clamp-1 sm:line-clamp-none">{log.activities}</p>
                </div>
              </div>
              <span className={`inline-flex self-start sm:self-center font-mono font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border ${
                log.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
              }`}>
                {log.status}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}