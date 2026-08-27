import { useState } from 'react';
import { ShieldCheck, Search } from 'lucide-react';
import Card from '../../components/common/Card';
import StatusPill from '../../components/common/StatusPill';
import EmptyState from '../../components/common/EmptyState';
import { roleChip } from '../../config/roleTheme';

// TODO(real-api): audits list should be served by universityService
// (e.g. getPendingLogbooks() once wired to a broader audit endpoint).
// See docs/PROGRESS.md "Data Source Status".
export default function UniversityAudits() {
  const [searchQuery, setSearchQuery] = useState('');
  const [audits] = useState([
    { id: 'aud-201', student: 'Sarah Jenkins', firm: 'Apex Cloud Labs', status: 'Verified', date: 'June 02, 2026' },
    { id: 'aud-202', student: 'Alex Rivera', firm: 'Quantum Systems', status: 'Pending review', date: 'June 05, 2026' }
  ]);

  const filtered = audits.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return `${item.student} ${item.firm}`.toLowerCase().includes(q);
  });

  const eyebrow = roleChip('university');

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-100 pb-6">
        <p className={eyebrow.classes}>{eyebrow.label}</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Compliance audits</h1>
        <p className="mt-1 text-sm text-slate-500">Review and verify student attachment records.</p>
      </div>

      <div className="relative w-full sm:w-80">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by student or firm…"
          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-4 focus:ring-cyan-500/10"
        />
      </div>

      <Card title="Audit records" eyebrow={`${filtered.length} total`} bodyClassName="p-0">
        {filtered.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No audit records found"
            description="No records match your current search."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Firm</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Last updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-slate-50/60">
                    <td className="px-5 py-4 font-bold text-slate-900">{item.student}</td>
                    <td className="px-5 py-4 text-slate-600">{item.firm}</td>
                    <td className="px-5 py-4">
                      <StatusPill status={item.status} />
                    </td>
                    <td className="px-5 py-4 text-slate-400">{item.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}