import { useState } from 'react';

export default function FirmApplicants() {
  const [candidates] = useState([
    { id: 'app-501', name: 'Sarah Jenkins', role: 'Cloud Architecture Intern', school: 'Stanford University', match: '98%', status: 'Awaiting Screening' },
    { id: 'app-502', name: 'Amara Okafor', role: 'AI / ML Research Intern', school: 'Carnegie Mellon', match: '91%', status: 'Interview Scheduled' },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] font-bold font-mono uppercase bg-amber-50 text-amber-700 px-2.5 py-1 rounded border border-amber-100">
          Hiring Pipeline Terminal
        </span>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-2">Active Candidates & Applicants</h1>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
          Incoming Pipeline Stream
        </div>
        <div className="divide-y divide-slate-100">
          {candidates.map((cand) => (
            <div key={cand.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/40 transition-all">
              <div>
                <h3 className="text-xs font-bold text-slate-900">{cand.name}</h3>
                <p className="text-xs text-slate-400 font-semibold font-mono mt-0.5">{cand.school} • Match: <span className="text-amber-600">{cand.match}</span></p>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-6">
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono">Role Target</span>
                  <span className="text-xs font-bold text-slate-700 font-mono">{cand.role}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded border text-[10px] font-mono font-bold uppercase bg-amber-50 text-amber-700 border-amber-200">
                  {cand.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}