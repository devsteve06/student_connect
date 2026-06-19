import React, { useState, useMemo } from 'react';
import Button from '../../../components/common/Button';

export default function FirmDashboard() {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'hired'
  const [searchQuery, setSearchQuery] = useState('');

  // 2026 Core Mock Context Array
  const [applicants, setApplicants] = useState([
    {
      id: 'app-101',
      candidate: 'Sarah Jenkins',
      role: 'Cloud Architecture Intern',
      institution: 'Stanford University',
      gpa: '3.92',
      matchScore: 98,
      status: 'Pending Review',
      appliedDate: '2 hours ago',
      avatar: 'SJ'
    },
    {
      id: 'app-102',
      candidate: 'Alex Rivera',
      role: 'Backend Systems Engineer',
      institution: 'MIT',
      gpa: '3.85',
      matchScore: 94,
      status: 'Hired',
      appliedDate: 'Yesterday',
      avatar: 'AR'
    },
    {
      id: 'app-103',
      candidate: 'Amara Okafor',
      role: 'AI / ML Research Intern',
      institution: 'Carnegie Mellon',
      gpa: '4.00',
      matchScore: 91,
      status: 'Pending Review',
      appliedDate: '3 days ago',
      avatar: 'AO'
    }
  ]);

  // Derived Pipeline Analytics 
  const metrics = useMemo(() => {
    return {
      total: applicants.length,
      pending: applicants.filter(a => a.status === 'Pending Review').length,
      hired: applicants.filter(a => a.status === 'Hired').length,
      avgMatch: Math.round(applicants.reduce((acc, a) => acc + a.matchScore, 0) / applicants.length)
    };
  }, [applicants]);

  // Interactive Query Matrix Filtering
  const filteredApplicants = useMemo(() => {
    return applicants.filter(app => {
      const matchesTab = 
        activeTab === 'all' || 
        (activeTab === 'pending' && app.status === 'Pending Review') ||
        (activeTab === 'hired' && app.status === 'Hired');
        
      const matchesSearch = 
        app.candidate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.institution.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [applicants, activeTab, searchQuery]);

  const handleStatusChange = (id, newStatus) => {
    setApplicants(prev => prev.map(app => 
      app.id === id ? { ...app, status: newStatus } : app
    ));
  };

  return (
    <div className="space-y-8">
      
      {/* SECTION 1: CONTEXT HEADER CONTROL MATRIX */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-100 font-mono">
            Corporate Gate / Runtime 2026
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-2">Talent Acquisition Terminal</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="h-10 px-4 rounded-xl text-xs font-bold border-slate-200">
            Export Roster .CSV
          </Button>
          <Button className="h-10 px-5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-500/10">
            + Provision Custom Opening
          </Button>
        </div>
      </div>

      {/* SECTION 2: BENTO HIGH-DENSITY METRIC GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Incoming Stream</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{metrics.total}</span>
            <span className="text-xs font-bold text-slate-400">Profiles</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between space-y-4 border-l-2 border-l-amber-500">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider font-mono">Action Required</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{metrics.pending}</span>
            <span className="text-xs font-bold text-amber-600/80 font-mono">Awaiting Review</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider font-mono">Signed Contracts</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">{metrics.hired}</span>
            <span className="text-xs font-bold text-emerald-600 font-mono">Onboarded</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between space-y-4 bg-slate-950 text-white">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">AI Matching Accuracy</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black tracking-tight text-amber-400 font-mono">{metrics.avgMatch}%</span>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Mean Fit</span>
          </div>
        </div>

      </div>

      {/* SECTION 3: DATAGRID FILTER CONTROLS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-2 rounded-xl border border-slate-100">
        
        {/* Tab Filters */}
        <div className="flex items-center gap-1 w-full sm:w-auto bg-slate-200/60 p-1 rounded-lg text-xs font-bold">
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md transition-all ${activeTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            All Candidates
          </button>
          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-md transition-all ${activeTab === 'pending' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Pending ({metrics.pending})
          </button>
          <button 
            onClick={() => setActiveTab('hired')}
            className={`px-3 py-1.5 rounded-md transition-all ${activeTab === 'hired' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Hired ({metrics.hired})
          </button>
        </div>

        {/* Input Text Box Filter */}
        <div className="w-full sm:w-72">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate, role, or school..." 
            className="w-full text-xs border border-slate-200 bg-white px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500 font-medium placeholder-slate-400 shadow-inner"
          />
        </div>

      </div>

      {/* SECTION 4: CANDIDATE GRID STREAM */}
      <div className="space-y-3">
        {filteredApplicants.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-xs text-slate-400 font-medium font-mono">
            Zero entities match query parameter criteria.
          </div>
        ) : (
          filteredApplicants.map((app) => (
            <div key={app.id} className="bg-white border border-slate-100 rounded-xl p-5 hover:border-slate-200 shadow-sm transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              
              {/* Left Column: Profile Descriptor */}
              <div className="flex items-center gap-4 min-w-[280px]">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-amber-400 font-mono font-bold text-xs flex items-center justify-center border border-slate-700 shadow-inner">
                  {app.avatar}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">{app.candidate}</h3>
                  <p className="text-xs font-semibold text-slate-400 font-mono mt-0.5">{app.institution} • GPA {app.gpa}</p>
                </div>
              </div>

              {/* Middle Left: Targeted Corporate Role Allocation */}
              <div className="min-w-[200px]">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono">Target Application Scope</span>
                <span className="text-xs font-bold text-slate-700 tracking-tight block mt-0.5">{app.role}</span>
              </div>

              {/* Middle Right: System Evaluated Fit Engine */}
              <div className="flex items-center gap-3">
                <div>
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono">Match Matrix Score</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${app.matchScore}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-800 font-mono">{app.matchScore}%</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Dynamic Status Routing Actions */}
              <div className="flex items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-50">
                <div className="text-left lg:text-right">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono">Lifecycle Node</span>
                  <span className={`inline-flex font-mono font-bold text-[9px] uppercase tracking-wider mt-1 px-2 py-0.5 rounded border ${
                    app.status === 'Hired' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {app.status}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {app.status === 'Pending Review' ? (
                    <>
                      <button 
                        onClick={() => handleStatusChange(app.id, 'Hired')}
                        className="h-8 px-3 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm"
                      >
                        Approve Hire
                      </button>
                      <button 
                        onClick={() => handleStatusChange(app.id, 'Rejected')}
                        className="h-8 px-2.5 rounded-lg text-[11px] font-bold bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-all"
                      >
                        Decline
                      </button>
                    </>
                  ) : (
                    <span className="text-[10px] font-mono font-semibold text-slate-400 italic px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
                      Evaluated {app.appliedDate}
                    </span>
                  )}
                </div>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}