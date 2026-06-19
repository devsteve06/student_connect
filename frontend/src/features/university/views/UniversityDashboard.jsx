import React, { useState, useMemo } from 'react';
import Button from '../../../components/common/Button';

export default function UniversityDashboard() {
  const [selectedCohort, setSelectedCohort] = useState('2026');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Core Academic Tracking Dataset
  const [students, setStudents] = useState([
    { id: 'stu-801', name: 'Sarah Jenkins', major: 'Computer Science', firm: 'Apex Cloud Labs', status: 'Approved', auditScore: 98, progress: 85 },
    { id: 'stu-802', name: 'Alex Rivera', major: 'Electrical Engineering', firm: 'Quantum Systems', status: 'Pending Verification', auditScore: 92, progress: 40 },
    { id: 'stu-803', name: 'Amara Okafor', major: 'Data Science', firm: 'Neural Corp AI', status: 'Approved', auditScore: 96, progress: 100 },
    { id: 'stu-804', name: 'Liam Chen', major: 'Software Engineering', firm: 'Awaiting Match', status: 'Unassigned', auditScore: 0, progress: 0 }
  ]);

  // 2. High-Density Analytics Matrix Computations
  const stats = useMemo(() => {
    const assigned = students.filter(s => s.status !== 'Unassigned').length;
    return {
      totalCount: students.length,
      placementRate: Math.round((assigned / students.length) * 100),
      pendingAudits: students.filter(s => s.status === 'Pending Verification').length,
      avgAudit: Math.round(students.reduce((acc, s) => acc + s.auditScore, 0) / assigned || 0)
    };
  }, [students]);

  // 3. Search and Cohort Filter Engine Rules
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      return student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             student.major.toLowerCase().includes(searchQuery.toLowerCase()) ||
             student.firm.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [students, searchQuery]);

  return (
    <div className="space-y-8">
      
      {/* MODULE 1: ACADEMIC TERMINAL HEADER & GLOBAL EXPORT CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-100 font-mono">
            University Registrar Gate / Node 2026
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-2">Academic Placement Registry</h1>
        </div>
        <div className="flex items-center gap-3 self-start md:self-center">
          <select 
            value={selectedCohort} 
            onChange={(e) => setSelectedCohort(e.target.value)}
            className="h-10 px-3 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-mono"
          >
            <option value="2026">Cohort 2026</option>
            <option value="2025">Cohort 2025</option>
          </select>
          <Button variant="secondary" className="h-10 px-4 rounded-xl text-xs font-bold border-slate-200 flex items-center gap-1.5">
            📥 Export Ledger .CSV
          </Button>
        </div>
      </div>

      {/* MODULE 2: REGISTRY BENTO METRIC GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Total Enrolled</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{stats.totalCount}</span>
            <span className="text-xs font-bold text-slate-400 font-mono">Students</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between space-y-4 border-l-2 border-l-indigo-600">
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider font-mono">Placement Ratio</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{stats.placementRate}%</span>
            <span className="text-xs font-bold text-indigo-500 font-mono">Matched</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider font-mono">Awaiting Compliance</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{stats.pendingAudits}</span>
            <span className="text-xs font-bold text-amber-500 font-mono">Open Audits</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between space-y-4 bg-slate-950 text-white">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Platform Health Index</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black tracking-tight text-indigo-400 font-mono">{stats.avgAudit}</span>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Mean Quality Score</span>
          </div>
        </div>
      </div>

      {/* MODULE 3: HIGH-DENSITY COHORT MONITORING & METRIC LOG FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Flagged Audit Pipeline Stream (2/3 Width) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <div>
              <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider font-mono block">Compliance Tracking</span>
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">Active Audit Queue</h2>
            </div>
            <Button variant="secondary" className="h-7 px-2 rounded-lg text-[10px] font-bold border-slate-200">
              Bulk Verify
            </Button>
          </div>

          <div className="divide-y divide-slate-50">
            {students.filter(s => s.status !== 'Unassigned').map((student, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0 hover:bg-slate-50/40 px-1 rounded-lg transition-all">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{student.name}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${
                      student.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {student.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-semibold font-mono">{student.major} — <span className="text-slate-800 font-bold">{student.firm}</span></p>
                </div>
                
                <div className="text-right shrink-0">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Audit Rating</span>
                  <span className="text-xs font-black text-slate-900 font-mono">
                    {student.auditScore}/100
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Major Allocation Quotas (1/3 Width) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono block">Department Metrics</span>
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">Major Tracks Allocation</h2>
            </div>
            <span className="text-[10px] font-mono text-indigo-600 font-bold bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
              Synced
            </span>
          </div>

          <div className="space-y-4">
            {[
              { name: 'Computer Science', assigned: 24, total: 30, color: 'bg-indigo-600' },
              { name: 'Data Science', assigned: 12, total: 15, color: 'bg-slate-900' },
              { name: 'Electrical Eng.', assigned: 8, total: 20, color: 'bg-amber-500' }
            ].map((major, idx) => {
              const percentAllocated = (major.assigned / major.total) * 100;

              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 truncate max-w-[150px]">{major.name}</span>
                    <span className="font-mono text-[11px] font-bold text-slate-500 shrink-0">
                      <span className="text-slate-900">{major.assigned}</span>/{major.total}
                    </span>
                  </div>
                  
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden relative border border-slate-200/20">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${major.color}`} 
                      style={{ width: `${percentAllocated}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* MODULE 4: INTERACTIVE REGISTRY MATRIX CONTROL BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-2 rounded-xl border border-slate-100">
        <div className="text-xs font-bold text-slate-500 px-2">
          Reviewing Academic Database <span className="font-mono text-indigo-600">({filteredStudents.length} entries matching)</span>
        </div>
        <div className="w-full sm:w-72">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student, track, or assigned company..." 
            className="w-full text-xs border border-slate-200 bg-white px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500 font-medium placeholder-slate-400 shadow-inner"
          />
        </div>
      </div>

      {/* MODULE 5: THE LIVE MASTER STUDENT LOG MATRIX */}
      <div className="space-y-3">
        {filteredStudents.map((student) => (
          <div key={student.id} className="bg-white border border-slate-100 rounded-xl p-5 hover:border-slate-200 shadow-sm transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* Student Persona Column */}
            <div className="flex items-center gap-4 min-w-[240px]">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-indigo-950 to-indigo-800 text-indigo-300 font-mono font-bold text-xs flex items-center justify-center border border-indigo-700 shadow-inner">
                {student.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">{student.name}</h3>
                <p className="text-xs font-semibold text-slate-400 font-mono mt-0.5">{student.major}</p>
              </div>
            </div>

            {/* Corporate Nodes Allocation Column */}
            <div className="min-w-[180px]">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono">Attachment Hub Node</span>
              <span className="text-xs font-bold text-slate-700 tracking-tight block mt-0.5">{student.firm}</span>
            </div>

            {/* Practical Logbook Hour Progress Track */}
            <div className="flex items-center gap-3 min-w-[160px]">
              <div className="w-full">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono">Attachment Hour Completion</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${student.progress}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-800 font-mono">{student.progress}%</span>
                </div>
              </div>
            </div>

            {/* Actions & Verification Flag Column */}
            <div className="flex items-center justify-between lg:justify-end gap-6 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-50">
              <div className="text-left lg:text-right">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono">Status Node</span>
                <span className={`inline-flex font-mono font-bold text-[9px] uppercase tracking-wider mt-1 px-2 py-0.5 rounded border ${
                  student.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                  student.status === 'Unassigned' ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {student.status}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button className="h-8 px-3 rounded-lg text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-sm">
                  Review Log
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}