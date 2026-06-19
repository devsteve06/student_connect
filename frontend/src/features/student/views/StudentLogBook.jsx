import { useState, useEffect } from 'react';
import Button from '../../../components/common/Button';

export default function StudentLogbook() {
  const [logbooks, setLogbooks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [newEntry, setNewEntry] = useState({
    weekNumber: '',
    startDate: '',
    endDate: '',
    activities: '',
    competencies: '',
    challenges: ''
  });

  useEffect(() => {
    // Simulating API loading tracking sequence
    const mockLogbooks = [
      {
        id: 'log-01',
        weekNumber: 1,
        dateRange: 'May 11 - May 15, 2026',
        activities: 'Completed corporate onboarding and configured local Kubernetes development pods. Spearheaded migration of auth middleware matrices to production standard.',
        competencies: 'Docker, Container Orchestration, IAM Policies',
        status: 'Approved',
        supervisorComment: 'Excellent start to the placement attachment cycle. Code quality parameters met.'
      },
      {
        id: 'log-02',
        weekNumber: 2,
        dateRange: 'May 18 - May 22, 2026',
        activities: 'Patched critical database edge pools. Built standard parameterized queries matching frontend form payload fields to neutralize injection vulnerabilities.',
        competencies: 'Database Tuning, Secure Coding Practices, SQL Optimization',
        status: 'Pending Review',
        supervisorComment: null
      }
    ];

    setTimeout(() => {
      setLogbooks(mockLogbooks);
      setLoading(false);
    }, 400);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEntry(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const formattedEntry = {
      id: `log-${Date.now()}`,
      weekNumber: parseInt(newEntry.weekNumber),
      dateRange: `${newEntry.startDate} to ${newEntry.endDate}`,
      activities: newEntry.activities,
      competencies: newEntry.competencies,
      status: 'Pending Review',
      supervisorComment: null
    };

    setLogbooks(prev => [formattedEntry, ...prev]);
    setIsModalOpen(false);
    setNewEntry({ weekNumber: '', startDate: '', endDate: '', activities: '', competencies: '', challenges: '' });
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-xs font-bold text-slate-400 font-mono animate-pulse uppercase tracking-widest">
        Syncing structural logbook ledger...
      </div>
    );
  }

  return (
    <div className="space-y-10">
      
      {/* Top Banner Control Bar */}
      <div className="border-b border-slate-100 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-100 font-mono">
            Logbook Crypt-Matrix
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-3">Industrial Training Logbook</h1>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="h-10 px-5 rounded-xl self-start sm:self-center">
          + Log Weekly Milestone
        </Button>
      </div>

      {/* Main Stream Matrix */}
      <div className="space-y-6">
        {logbooks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-xs text-slate-400 font-medium">
            No entries captured in your current attachment contract configuration.
          </div>
        ) : (
          logbooks.map((log) => (
            <div key={log.id} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:border-slate-200 transition-all space-y-6">
              
              {/* Header Segment */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-slate-950 text-white flex items-center justify-center font-mono font-bold text-xs">
                    W{log.weekNumber}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Weekly Metric Sequence</h3>
                    <p className="text-xs font-semibold text-slate-400 font-mono">{log.dateRange}</p>
                  </div>
                </div>

                <span className={`inline-flex self-start sm:self-center px-2.5 py-0.5 font-bold uppercase text-[9px] tracking-wider rounded border font-mono ${
                  log.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {log.status}
                </span>
              </div>

              {/* Text Core Body */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Core Daily Activities Handled</span>
                  <p className="text-slate-600 font-medium leading-relaxed">{log.activities}</p>
                </div>
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Competencies Built / Acquired</span>
                  <p className="text-slate-800 font-bold tracking-tight font-mono">{log.competencies}</p>
                </div>
              </div>

              {/* Internal Supervisor Feedback Block */}
              {log.supervisorComment && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">Corporate Supervisor Audit Notes</span>
                  <p className="text-slate-600 font-medium italic">"{log.supervisorComment}"</p>
                </div>
              )}

            </div>
          ))
        )}
      </div>

      {/* Slide / Pop Over Submission Sheet Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl border border-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight uppercase">Log Current Field Milestone</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-mono text-sm">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase">Week Number</label>
                  <input type="number" required name="weekNumber" value={newEntry.weekNumber} onChange={handleInputChange} placeholder="e.g. 3" className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:outline-none focus:bg-white focus:border-emerald-500 font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase">Start Date</label>
                  <input type="date" required name="startDate" value={newEntry.startDate} onChange={handleInputChange} className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:outline-none focus:bg-white focus:border-emerald-500 font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase">End Date</label>
                  <input type="date" required name="endDate" value={newEntry.endDate} onChange={handleInputChange} className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:outline-none focus:bg-white focus:border-emerald-500 font-mono" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase">Activities Executed</label>
                <textarea required name="activities" rows="3" value={newEntry.activities} onChange={handleInputChange} placeholder="Detail technical stack architectures engineered..." className="w-full text-xs border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:outline-none focus:bg-white focus:border-emerald-500 leading-relaxed font-medium" />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase">Competencies Gained (Comma Separated)</label>
                <input type="text" required name="competencies" value={newEntry.competencies} onChange={handleInputChange} placeholder="e.g. CI/CD Pipelines, GraphQL, Unit Testing" className="w-full text-xs border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:outline-none focus:bg-white focus:border-emerald-500 font-mono" />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase">Industrial Block Obstacles / Challenges</label>
                <input type="text" name="challenges" value={newEntry.challenges} onChange={handleInputChange} placeholder="e.g. Network synchronization latency, missing dependencies" className="w-full text-xs border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:outline-none focus:bg-white focus:border-emerald-500 font-medium" />
              </div>

              <div className="pt-4 border-t border-slate-50 flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="h-9 px-4 rounded-xl text-[11px]">Cancel</Button>
                <Button type="submit" className="h-9 px-5 rounded-xl text-[11px]">Commit To Ledger</Button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}